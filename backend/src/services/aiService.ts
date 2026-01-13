import OpenAI from 'openai';
import fs from 'fs';
import yaml from 'js-yaml';
import os from 'os';
import path from 'path';
import { AIFormattedItem } from '../types';
import { parseRelativeDate, formatDate } from '../utils/helpers';
import logger from '../utils/logger';

/**
 * 利用可能な最新AIモデル
 */
export enum AIModel {
  // ジェンスパーク最新モデル（推奨）
  GPT5 = 'gpt-5',              // 最新の高性能モデル
  GPT5_1 = 'gpt-5.1',          // GPT-5のアップグレード版
  GPT5_MINI = 'gpt-5-mini',    // 軽量高速版
  
  // 従来モデル（後方互換性用）
  GPT4 = 'gpt-4',
  GPT4_TURBO = 'gpt-4-turbo',
}

interface LLMConfig {
  openai?: {
    api_key?: string;
    base_url?: string;
  };
}

export class AIService {
  private openai: OpenAI;
  private model: AIModel;

  constructor(model: AIModel = AIModel.GPT5) {
    this.model = model;
    this.openai = this.initializeClient();
  }

  /**
   * OpenAIクライアントを初期化
   * ジェンスパークのLLM設定ファイルまたは環境変数から設定を読み込む
   */
  private initializeClient(): OpenAI {
    // 1. ~/.genspark_llm.yaml から設定を読み込み
    const configPath = path.join(os.homedir(), '.genspark_llm.yaml');
    let config: LLMConfig | null = null;

    if (fs.existsSync(configPath)) {
      try {
        const fileContents = fs.readFileSync(configPath, 'utf8');
        config = yaml.load(fileContents) as LLMConfig;
        logger.info('Loaded GenSpark LLM configuration from ~/.genspark_llm.yaml');
      } catch (error) {
        logger.warn('Failed to load GenSpark LLM config:', error);
      }
    }

    // 2. 設定を決定（優先順位: 設定ファイル > 環境変数）
    const apiKey = config?.openai?.api_key || process.env.OPENAI_API_KEY;
    const baseURL = config?.openai?.base_url || process.env.OPENAI_BASE_URL;

    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured. Please set up GenSpark LLM API key.');
    }

    logger.info(`Initializing AI Service with model: ${this.model}`);
    if (baseURL) {
      logger.info(`Using custom base URL: ${baseURL}`);
    }

    return new OpenAI({
      apiKey,
      baseURL,
    });
  }

  /**
   * 議事録テキストをAIで構造化
   * @param rawText 生の議事録テキスト
   * @param meetingDate 会議開催日
   * @param useAdvancedModel 高度なモデルを使用するか（デフォルト: true）
   */
  async formatMinutesText(
    rawText: string,
    meetingDate: Date,
    useAdvancedModel: boolean = true
  ): Promise<AIFormattedItem[]> {
    try {
      const prompt = this.buildPrompt(rawText, meetingDate);
      
      // テキスト長に応じてモデルを選択
      const selectedModel = this.selectOptimalModel(rawText, useAdvancedModel);

      logger.info(`Calling AI API for minutes formatting (model: ${selectedModel})`);
      logger.info(`Text length: ${rawText.length} characters`);

      const response = await this.openai.chat.completions.create({
        model: selectedModel,
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(),
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2, // より正確な出力のため低めに設定
        max_tokens: 4000,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from AI');
      }

      logger.info('AI API response received');

      // JSONをパース
      const parsed = JSON.parse(content);
      let items: AIFormattedItem[] = [];

      // レスポンスが配列の場合と、itemsプロパティを持つオブジェクトの場合に対応
      if (Array.isArray(parsed)) {
        items = parsed;
      } else if (parsed.items && Array.isArray(parsed.items)) {
        items = parsed.items;
      } else {
        throw new Error('Unexpected response format from AI');
      }

      // 日付の相対表現を具体的な日付に変換
      items = items.map((item) => ({
        ...item,
        deadline: item.deadline ? this.parseDeadline(item.deadline, meetingDate) : null,
      }));

      logger.info(`Formatted ${items.length} minute items using ${selectedModel}`);

      return items;
    } catch (error) {
      logger.error('AI formatting failed:', error);
      throw error;
    }
  }

  /**
   * 最適なモデルを選択
   */
  private selectOptimalModel(rawText: string, useAdvancedModel: boolean): string {
    const textLength = rawText.length;

    // 長文または複雑な議事録の場合は最新の高性能モデルを使用
    if (useAdvancedModel) {
      if (textLength > 5000) {
        // 非常に長い議事録: GPT-5.1（最高性能）
        return AIModel.GPT5_1;
      } else if (textLength > 2000) {
        // 長い議事録: GPT-5（高性能）
        return AIModel.GPT5;
      } else {
        // 通常の議事録: GPT-5 Mini（高速・コスト効率的）
        return AIModel.GPT5_MINI;
      }
    }

    // デフォルトは設定されたモデル
    return this.model;
  }

  /**
   * システムプロンプト
   */
  private getSystemPrompt(): string {
    return `あなたは企業の会議議事録を構造化する専門AIアシスタントです。

【あなたの役割】
1. 複雑で長文の議事録テキストから重要な情報を正確に抽出する
2. 議題、決定事項、課題、期日、担当者、実行内容、理由を明確に区別する
3. 曖昧な表現や口語的な表現を適切に解釈する
4. 複数の議題が混在していても、それぞれを分離して整理する

【出力の品質基準】
- 正確性: 元のテキストから逸脱しない
- 明瞭性: 簡潔で分かりやすい表現
- 構造化: 適切にカテゴリ分けされている
- 完全性: 重要な情報を漏らさない

必ずJSON形式で構造化されたデータを返してください。`;
  }

  /**
   * プロンプトを構築
   */
  private buildPrompt(rawText: string, meetingDate: Date): string {
    const today = formatDate(meetingDate);

    return `
以下の会議議事録テキストを構造化してください。

【会議開催日】${today}

【抽出項目】
- agenda: 議題（何について話し合われたか）
- decision: 決定事項（決まったこと、合意された内容）
- issue: 課題（問題点、懸念事項、未解決の論点）
- deadline: 期日（YYYY-MM-DD形式、言及がない場合はnull）
- assignee: 担当者（個人名、チーム名、部署名）
- action_item: 実行内容（具体的にやるべきこと）
- reason: 理由・背景情報（なぜそうするのか、背景にある事情）

【出力形式】
{
  "items": [
    {
      "agenda": "議題の内容",
      "decision": "決定事項の内容",
      "issue": "課題の内容",
      "deadline": "2024-01-20",
      "assignee": "担当者名",
      "action_item": "実行内容",
      "reason": "理由・背景"
    }
  ]
}

【重要な注意事項】
1. 複数の議題がある場合は、配列の要素として分けてください
2. 決定事項と課題は明確に区別してください
   - 決定事項: 決まったこと、合意されたこと
   - 課題: まだ解決していない問題、懸念点
3. 期日の表現について:
   - 「来週」「月末」「明日」などはそのまま記載してください
   - 具体的な日付があれば YYYY-MM-DD 形式で記載してください
4. 担当者が不明な場合は null にしてください
5. 言及されていない項目は null にしてください
6. 曖昧な表現は文脈から適切に解釈してください

【議事録テキスト】
${rawText}

上記のテキストから構造化されたJSONを生成してください。
`;
  }

  /**
   * 期日の文字列を解析
   */
  private parseDeadline(deadlineStr: string, baseDate: Date): string | null {
    // すでにYYYY-MM-DD形式の場合
    if (/^\d{4}-\d{2}-\d{2}$/.test(deadlineStr)) {
      return deadlineStr;
    }

    // 相対表現を変換
    const parsed = parseRelativeDate(deadlineStr, baseDate);
    if (parsed) {
      return parsed;
    }

    // 変換できない場合はnull
    logger.warn(`Could not parse deadline: ${deadlineStr}`);
    return null;
  }

  /**
   * AI APIの利用状況を確認
   */
  async checkAPIUsage(): Promise<boolean> {
    try {
      // シンプルなテストリクエストを送信
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'user', content: 'Hello' }
        ],
        max_tokens: 5,
      });
      
      return response.choices.length > 0;
    } catch (error) {
      logger.error('AI API check failed:', error);
      return false;
    }
  }

  /**
   * 使用中のモデルを取得
   */
  getModel(): AIModel {
    return this.model;
  }

  /**
   * モデルを変更
   */
  setModel(model: AIModel): void {
    this.model = model;
    logger.info(`AI model changed to: ${model}`);
  }
}
