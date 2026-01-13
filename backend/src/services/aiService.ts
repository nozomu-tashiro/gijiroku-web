import OpenAI from 'openai';
import { AIFormattedItem } from '../types';
import { parseRelativeDate, formatDate } from '../utils/helpers';
import logger from '../utils/logger';

export class AIService {
  private openai: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }
    this.openai = new OpenAI({ apiKey });
  }

  /**
   * 議事録テキストをAIで構造化
   */
  async formatMinutesText(rawText: string, meetingDate: Date): Promise<AIFormattedItem[]> {
    try {
      const prompt = this.buildPrompt(rawText, meetingDate);

      logger.info('Calling OpenAI API for minutes formatting');

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'あなたは会議議事録を構造化するAIアシスタントです。議事録から重要な情報を抽出し、JSON形式で返してください。',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      logger.info('OpenAI API response received');

      // JSONをパース
      const parsed = JSON.parse(content);
      let items: AIFormattedItem[] = [];

      // レスポンスが配列の場合と、itemsプロパティを持つオブジェクトの場合に対応
      if (Array.isArray(parsed)) {
        items = parsed;
      } else if (parsed.items && Array.isArray(parsed.items)) {
        items = parsed.items;
      } else {
        throw new Error('Unexpected response format from OpenAI');
      }

      // 日付の相対表現を具体的な日付に変換
      items = items.map((item) => ({
        ...item,
        deadline: item.deadline ? this.parseDeadline(item.deadline, meetingDate) : null,
      }));

      logger.info(`Formatted ${items.length} minute items`);

      return items;
    } catch (error) {
      logger.error('AI formatting failed:', error);
      throw error;
    }
  }

  /**
   * プロンプトを構築
   */
  private buildPrompt(rawText: string, meetingDate: Date): string {
    const today = formatDate(meetingDate);

    return `
以下の会議議事録テキストから、下記の項目を抽出してJSON形式で返してください。

抽出項目:
- agenda: 議題（何について話し合われたか）
- decision: 決定事項（決まったこと）
- issue: 課題（問題点や懸念事項）
- deadline: 期日（YYYY-MM-DD形式、言及されていない場合はnull）
- assignee: 担当者（名前やチーム名）
- action_item: 実行内容（やるべきこと）
- reason: 理由・背景情報

複数の議題がある場合は、配列の要素として分けてください。
期日が「来週」「月末」「明日」などの表現の場合は、そのまま記載してください（後で変換します）。

出力形式:
{
  "items": [
    {
      "agenda": "議題の内容",
      "decision": "決定事項の内容",
      "issue": "課題の内容",
      "deadline": "2024-01-20" or "来週" or null,
      "assignee": "担当者名",
      "action_item": "実行内容",
      "reason": "理由・背景"
    }
  ]
}

注意事項:
- 会議開催日は ${today} です
- 明確に言及されていない項目はnullにしてください
- 複数の議題がある場合は、それぞれ別の要素として分けてください
- 決定事項と課題は明確に区別してください

議事録テキスト:
${rawText}
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
   * OpenAI APIの利用状況を確認
   */
  async checkAPIUsage(): Promise<boolean> {
    try {
      const response = await this.openai.models.list();
      return response.data.length > 0;
    } catch (error) {
      logger.error('OpenAI API check failed:', error);
      return false;
    }
  }
}
