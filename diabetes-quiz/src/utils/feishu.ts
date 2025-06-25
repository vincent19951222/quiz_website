/**
 * 飞书多维表格API工具类
 * 用于将答题记录同步到飞书多维表格
 */

// 飞书API配置接口
interface FeishuConfig {
  app_id: string;
  app_secret: string;
  table_app_token: string;
  table_id: string;
}

// 答题记录数据结构
interface QuizRecord {
  name: string;
  phone: string;
  score: number;
  correctRate: number;
  wrongCount: number;
  timeUsed: string;
  startTime: string;
  endTime: string;
  answers: Array<{
    question: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
  }>;
  ipAddress?: string;
  userAgent?: string;
}

// 飞书访问令牌响应
interface AccessTokenResponse {
  code: number;
  msg: string;
  tenant_access_token: string;
  expire: number;
}

// 飞书表格记录响应
interface CreateRecordResponse {
  code: number;
  msg: string;
  data: {
    record: {
      record_id: string;
      fields: Record<string, any>;
    };
  };
}

class FeishuAPI {
  private config: FeishuConfig;
  private accessToken: string | null = null;
  private tokenExpireTime: number = 0;

  constructor(config: FeishuConfig) {
    this.config = config;
  }

  /**
   * 获取飞书访问令牌
   * @returns Promise<string> 访问令牌
   */
  private async getAccessToken(): Promise<string> {
    // 如果令牌未过期，直接返回
    if (this.accessToken && Date.now() < this.tokenExpireTime) {
      console.log('✓ 使用缓存的访问令牌');
      return this.accessToken;
    }

    try {
      console.log('🔄 正在获取新的访问令牌...');
      console.log('📋 配置信息:', {
        app_id: this.config.app_id ? `${this.config.app_id.substring(0, 8)}...` : '未配置',
        app_secret: this.config.app_secret ? '已配置' : '未配置',
        table_app_token: this.config.table_app_token ? `${this.config.table_app_token.substring(0, 8)}...` : '未配置',
        table_id: this.config.table_id ? `${this.config.table_id.substring(0, 8)}...` : '未配置'
      });
      
      const response = await fetch('/api/feishu/open-apis/auth/v3/tenant_access_token/internal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          app_id: this.config.app_id,
          app_secret: this.config.app_secret,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ HTTP错误响应:', response.status, response.statusText, errorText);
        throw new Error(`HTTP错误: ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error('❌ 非JSON响应:', contentType, responseText);
        throw new Error(`服务器返回非JSON响应: ${contentType}`);
      }

      const data: AccessTokenResponse = await response.json();
      console.log('📡 飞书API响应:', { code: data.code, msg: data.msg });
      
      if (data.code !== 0) {
        throw new Error(`获取访问令牌失败: ${data.msg} (错误码: ${data.code})`);
      }

      this.accessToken = data.tenant_access_token;
      // 提前5分钟过期，确保令牌有效性
      this.tokenExpireTime = Date.now() + (data.expire - 300) * 1000;
      
      console.log('✅ 访问令牌获取成功');
      return this.accessToken;
    } catch (error) {
      console.error('❌ 获取飞书访问令牌失败:', error);
      throw error;
    }
  }

  /**
   * 将答题记录转换为飞书表格字段格式
   * @param record 答题记录
   * @returns 飞书表格字段对象
   */
  private formatRecordForFeishu(record: QuizRecord): Record<string, any> {
    // 检查是否查看过答案（根据用户手机号从localStorage获取）
    const hasViewedAnswers = localStorage.getItem(`viewed_answers_${record.phone}`) === 'true';
    
    // 按照更新后的飞书多维表格字段要求格式化数据
    return {
      '姓名': record.name,
      '手机号': record.phone,
      '得分': record.score,
      '正确率': record.correctRate, // 数字类型，不加%符号
      '错题数': record.wrongCount,
      '答题用时': record.timeUsed,
      '答题时间': record.endTime, // 使用结束时间作为答题时间
      '查看答案': hasViewedAnswers ? '是' : '否'
    };
  }

  /**
   * 上传答题记录到飞书多维表格
   * @param record 答题记录
   * @returns Promise<boolean> 是否上传成功
   */
  async uploadQuizRecord(record: QuizRecord): Promise<boolean> {
    try {
      const accessToken = await this.getAccessToken();
      const fields = this.formatRecordForFeishu(record);

      const response = await fetch(
        `/api/feishu/open-apis/bitable/v1/apps/${this.config.table_app_token}/tables/${this.config.table_id}/records`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fields,
          }),
        }
      );

      const data: CreateRecordResponse = await response.json();
      
      if (data.code !== 0) {
        throw new Error(`上传记录失败: ${data.msg}`);
      }

      console.log('答题记录已成功上传到飞书:', data.data.record.record_id);
      return true;
    } catch (error) {
      console.error('上传答题记录到飞书失败:', error);
      return false;
    }
  }

  /**
   * 批量上传答题记录
   * @param records 答题记录数组
   * @returns Promise<number> 成功上传的记录数量
   */
  async batchUploadQuizRecords(records: QuizRecord[]): Promise<number> {
    let successCount = 0;
    
    for (const record of records) {
      const success = await this.uploadQuizRecord(record);
      if (success) {
        successCount++;
      }
      // 添加延迟避免API限流
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return successCount;
  }

  /**
   * 测试飞书连接
   * @returns Promise<boolean> 连接是否成功
   */
  async testConnection(): Promise<boolean> {
    try {
      // 1. 获取访问令牌
      const accessToken = await this.getAccessToken();
      console.log('✓ 访问令牌获取成功');
      
      // 2. 测试表格访问权限 - 查询记录（测试读取权限）
      const response = await fetch(
        `/api/feishu/open-apis/bitable/v1/apps/${this.config.table_app_token}/tables/${this.config.table_id}/records/search`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            page_size: 1 // 只获取1条记录用于测试
          })
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ 表格访问HTTP错误:', response.status, response.statusText, errorText);
        throw new Error(`表格访问HTTP错误: ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error('❌ 表格访问非JSON响应:', contentType, responseText);
        throw new Error(`表格访问返回非JSON响应: ${contentType}`);
      }

      const data = await response.json();
      
      if (data.code !== 0) {
        throw new Error(`表格访问失败: ${data.msg}`);
      }
      
      console.log('✓ 表格访问权限验证成功');
      console.log('✓ 飞书连接测试完全成功');
      return true;
    } catch (error) {
      console.error('飞书连接测试失败:', error);
      return false;
    }
  }
}

// 从环境变量或配置文件获取飞书配置
function getFeishuConfig(): FeishuConfig {
  // 优先从环境变量获取
  if (import.meta.env.VITE_FEISHU_APP_ID) {
    return {
      app_id: import.meta.env.VITE_FEISHU_APP_ID,
      app_secret: import.meta.env.VITE_FEISHU_APP_SECRET,
      table_app_token: import.meta.env.VITE_FEISHU_TABLE_APP_TOKEN,
      table_id: import.meta.env.VITE_FEISHU_TABLE_ID,
    };
  }
  
  // 如果环境变量未配置，返回空配置（需要用户手动配置）
  return {
    app_id: '',
    app_secret: '',
    table_app_token: '',
    table_id: '',
  };
}

// 创建飞书API实例
let feishuAPI: FeishuAPI | null = null;

/**
 * 获取飞书API实例
 * @returns FeishuAPI实例或null（如果未配置）
 */
export function getFeishuAPI(): FeishuAPI | null {
  if (!feishuAPI) {
    const config = getFeishuConfig();
    
    // 检查配置是否完整
    if (!config.app_id || !config.app_secret || !config.table_app_token || !config.table_id) {
      console.warn('飞书配置不完整，将使用本地存储');
      return null;
    }
    
    feishuAPI = new FeishuAPI(config);
  }
  
  return feishuAPI;
}

/**
 * 上传答题记录到飞书（带错误处理）
 * @param record 答题记录
 * @returns Promise<boolean> 是否上传成功
 */
export async function uploadToFeishu(record: QuizRecord): Promise<boolean> {
  const api = getFeishuAPI();
  
  if (!api) {
    console.log('飞书未配置，记录将只保存在本地');
    return false;
  }
  
  try {
    return await api.uploadQuizRecord(record);
  } catch (error) {
    console.error('上传到飞书失败，记录已保存在本地:', error);
    return false;
  }
}

/**
 * 批量同步本地记录到飞书
 * @param records 本地答题记录数组
 * @returns Promise<number> 成功同步的记录数量
 */
export async function syncLocalRecordsToFeishu(records: QuizRecord[]): Promise<number> {
  const api = getFeishuAPI();
  
  if (!api) {
    console.warn('飞书未配置，无法同步记录');
    return 0;
  }
  
  return await api.batchUploadQuizRecords(records);
}

/**
 * 测试飞书连接状态
 * @returns Promise<boolean> 连接是否正常
 */
export async function testFeishuConnection(): Promise<boolean> {
  const api = getFeishuAPI();
  
  if (!api) {
    return false;
  }
  
  return await api.testConnection();
}

export type { QuizRecord, FeishuConfig };