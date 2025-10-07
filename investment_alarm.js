/**
 * 価格監視とSlack通知システム
 * Google Apps Script用
 */

// 設定オブジェクト
const CONFIG = {
  SLACK_WEBHOOK_URL: "",
  ALPHA_VANTAGE_API_KEY: "",
  TODOIST_API_KEY: "",
  TODO_PROJECT_ID: "",
  WEEKEND_DAYS: [0, 6], // 日曜日と土曜日
  API_ENDPOINTS: {
    STOCK:
      "https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol={symbol}&interval=5min&apikey={apiKey}",
    EXCHANGE:
      "https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency={from}&to_currency={to}&apikey={apiKey}",
  },
};

/**
 * 価格データ取得インターフェース
 */
class PriceProvider {
  constructor() {
    this.apiKey = CONFIG.ALPHA_VANTAGE_API_KEY;
  }

  /**
   * タイプに応じて価格を取得
   */
  getPrice(item) {
    switch (item.type) {
      case "stock":
        return this.getStockPrice(item.symbol);
      case "exchange":
        return this.getExchangeRate(item.symbol);
      default:
        throw new Error(`未対応のタイプ: ${item.type}`);
    }
  }

  /**
   * 株価を取得
   */
  getStockPrice(symbol) {
    const url = this.buildStockUrl(symbol);

    try {
      const response = UrlFetchApp.fetch(url);
      const data = JSON.parse(response.getContentText());

      const timeSeries = data["Time Series (5min)"];
      if (!timeSeries) {
        Logger.log(`株価データが見つかりません (${symbol}):`, data);
        return 0;
      }

      const latestTimestamp = Object.keys(timeSeries)[0];
      const latestPrice = timeSeries[latestTimestamp]?.["4. close"] || 0;

      Logger.log(`${symbol}の最新の株価: $${latestPrice}`);
      return parseFloat(latestPrice);
    } catch (error) {
      Logger.log(`株価取得エラー (${symbol}): ${error.message}`);
      return 0;
    }
  }

  /**
   * 為替レートを取得
   */
  getExchangeRate(currencyPair) {
    const [fromCurrency, toCurrency] = currencyPair.split("/");
    const url = this.buildExchangeUrl(fromCurrency, toCurrency);

    try {
      const response = UrlFetchApp.fetch(url);
      const data = JSON.parse(response.getContentText());

      const exchangeRate =
        data["Realtime Currency Exchange Rate"]?.["5. Exchange Rate"];
      if (!exchangeRate) {
        Logger.log(`為替レートデータが見つかりません (${currencyPair}):`, data);
        return 0;
      }

      Logger.log(`${currencyPair} 為替レート: ${exchangeRate}`);
      return parseFloat(exchangeRate);
    } catch (error) {
      Logger.log(`為替レート取得エラー (${currencyPair}): ${error.message}`);
      return 0;
    }
  }

  /**
   * 株価API URLを構築
   */
  buildStockUrl(symbol) {
    return CONFIG.API_ENDPOINTS.STOCK.replace("{symbol}", symbol).replace(
      "{apiKey}",
      this.apiKey
    );
  }

  /**
   * 為替API URLを構築
   */
  buildExchangeUrl(from, to) {
    return CONFIG.API_ENDPOINTS.EXCHANGE.replace("{from}", from)
      .replace("{to}", to)
      .replace("{apiKey}", this.apiKey);
  }
}

/**
 * 価格監視ロジック
 */
class PriceMonitor {
  constructor(priceProvider) {
    this.priceProvider = priceProvider;
  }

  /**
   * 価格がターゲットに達したかチェックし、通知メッセージを生成
   */
  checkPriceTarget(item, currentPrice) {
    const { symbol, target, isUpperTarget, unit } = item;

    const shouldNotify = isUpperTarget
      ? currentPrice >= target
      : currentPrice <= target;

    if (!shouldNotify) {
      return null;
    }

    const direction = isUpperTarget ? "上回りました↑↑🎉" : "下回りました↓↓🎉";
    return `${symbol}の価格が${target}${unit}を${direction} (${currentPrice}${unit})`;
  }

  /**
   * 単一アイテムの価格チェック
   */
  processItem(item) {
    try {
      const price = this.priceProvider.getPrice(item);
      if (price === 0) {
        Logger.log(`${item.symbol}の価格を取得できませんでした。`);
        return null;
      }

      return this.checkPriceTarget(item, price);
    } catch (error) {
      Logger.log(
        `${item.symbol}の処理中にエラーが発生しました: ${error.message}`
      );
      return null;
    }
  }
}

/**
 * Slack通知クラス
 */
class SlackNotifier {
  constructor() {
    this.webhookUrl = CONFIG.SLACK_WEBHOOK_URL;
  }

  /**
   * Slackに通知を送信
   */
  sendNotification(message) {
    if (!this.webhookUrl) {
      Logger.log("Slack Webhook URLが設定されていません");
      return;
    }

    const payload = {
      text: `<!channel> ${message}`,
    };

    const options = {
      method: "POST",
      contentType: "application/json",
      payload: JSON.stringify(payload),
    };

    try {
      UrlFetchApp.fetch(this.webhookUrl, options);
      Logger.log("Slack通知送信成功");
    } catch (error) {
      Logger.log(`Slack通知送信エラー: ${error.message}`);
    }
  }
}

/**
 * Todoistタスク作成クラス
 */
class TodoistTaskCreator {
  constructor() {
    this.apiKey = CONFIG.TODOIST_API_KEY;
    this.apiUrl = "https://api.todoist.com/rest/v2/tasks";
  }

  /**
   * Todoistにタスクを追加
   */
  createTask(content) {
    if (!this.apiKey) {
      Logger.log("Todoist APIキーが設定されていません");
      return;
    }

    const payload = {
      content: content,
      due_string: "Today",
      priority: 4, // 優先度1 (最高)
      project_id: CONFIG.TODO_PROJECT_ID,
    };

    const options = {
      method: "POST",
      contentType: "application/json",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true, // エラー時にもレスポンスボディを読み込む
    };

    try {
      const response = UrlFetchApp.fetch(this.apiUrl, options);
      const responseCode = response.getResponseCode();
      const responseBody = response.getContentText();

      if (responseCode === 200) {
        Logger.log("Todoistタスク作成成功");
      } else {
        Logger.log(
          `Todoistタスク作成エラー: ステータスコード ${responseCode}, レスポンス: ${responseBody}`
        );
      }
    } catch (error) {
      Logger.log(`Todoistタスク作成例外: ${error.message}`);
    }
  }
}

/**
 * 日時ユーティリティ
 */
function isWeekend() {
  const currentDay = new Date().getDay();
  return CONFIG.WEEKEND_DAYS.includes(currentDay);
}

/**
 * 価格監視システムのメインクラス
 */
class PriceMonitoringSystem {
  constructor() {
    this.priceProvider = new PriceProvider();
    this.priceMonitor = new PriceMonitor(this.priceProvider);
    this.slackNotifier = new SlackNotifier();
    this.todoistTaskCreator = new TodoistTaskCreator();
  }

  /**
   * 価格監視とSlack通知のメイン処理
   */
  run() {
    if (isWeekend()) {
      Logger.log("今日は週末です。処理をスキップします。");
      return;
    }

    const results = this.processWatchList();
    this.sendNotifications(results);
  }

  /**
   * 監視リストの処理
   */
  processWatchList() {
    return WATCH_LIST.map((item) => this.priceMonitor.processItem(item)).filter(
      (notification) => notification !== null
    );
  }

  /**
   * 通知の送信
   */
  sendNotifications(notifications) {
    notifications.forEach((notification) => {
      Logger.log(notification);
      this.slackNotifier.sendNotification(notification);
      this.todoistTaskCreator.createTask(notification);
    });
  }
}

/**
 * メイン実行関数（Google Apps Scriptのトリガー用）
 */
function checkAndSendNotifications() {
  const system = new PriceMonitoringSystem();
  system.run();
}

/**
 * 設定値の検証（初期設定時に使用）
 */
function validateConfig() {
  const errors = [];

  if (!CONFIG.ALPHA_VANTAGE_API_KEY) {
    errors.push("ALPHA_VANTAGE_API_KEYが設定されていません");
  }

  if (!CONFIG.SLACK_WEBHOOK_URL) {
    errors.push("SLACK_WEBHOOK_URLが設定されていません");
  }

  if (!CONFIG.TODOIST_API_KEY) {
    errors.push("TODOIST_API_KEYが設定されていません");
  }

  if (!CONFIG.TODO_PROJECT_ID) {
    errors.push("TODO_PROJECT_IDが設定されていません");
  }

  if (errors.length > 0) {
    Logger.log("設定エラー:", errors);
    return false;
  }

  Logger.log("設定は正常です");
  return true;
}
