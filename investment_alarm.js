/**
 * 価格監視とSlack通知システム
 * Google Apps Script用
 */
// 設定オブジェクト — 秘密は GAS Script Properties から取得
// （GAS エディタ > プロジェクトの設定 > スクリプト プロパティ に SLACK_WEBHOOK_URL /
//  ALPHA_VANTAGE_API_KEY / TODOIST_API_KEY を登録）
const SCRIPT_PROPS = PropertiesService.getScriptProperties();
const CONFIG = {
  SLACK_WEBHOOK_URL: SCRIPT_PROPS.getProperty("SLACK_WEBHOOK_URL") || "",
  ALPHA_VANTAGE_API_KEY: SCRIPT_PROPS.getProperty("ALPHA_VANTAGE_API_KEY") || "",
  TODOIST_API_KEY: SCRIPT_PROPS.getProperty("TODOIST_API_KEY") || "",
  TODO_PROJECT_ID: "2299385362",
  WEEKEND_DAYS: [0, 6], // 日曜日と土曜日
  YAHOO_API: "https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?interval=1d"
};

/**
 * 価格データ取得クラス (Yahoo Finance統合版)
 */
class PriceProvider {
  /**
   * どのタイプでもYahoo Financeから取得するように統一
   */
  getPrice(item) {
    return this.getYahooPrice(item.symbol);
  }

  /**
   * Yahoo Financeから価格を取得
   */
  getYahooPrice(symbol) {
    // URLエンコード
    const encodedSymbol = encodeURIComponent(symbol);
    const url = CONFIG.YAHOO_API.replace("{symbol}", encodedSymbol);

    try {
      const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
      if (response.getResponseCode() !== 200) {
        Logger.log(`Yahoo APIエラー (${symbol}): ${response.getContentText()}`);
        return 0;
      }

      const data = JSON.parse(response.getContentText());
      const result = data.chart?.result?.[0];

      if (!result || !result.meta) {
        Logger.log(`データが見つかりません (${symbol}):`, data);
        return 0;
      }

      // regularMarketPrice (現在値) を取得
      let currentPrice = result.meta.regularMarketPrice;

      // 現在値がmetaにない場合（閉場時など）、indicatorsから最新の終値を探す
      if (currentPrice === undefined || currentPrice === null) {
        const quotes = result.indicators?.quote?.[0]?.close;
        if (quotes && quotes.length > 0) {
          for (let i = quotes.length - 1; i >= 0; i--) {
            if (quotes[i] != null) {
              currentPrice = quotes[i];
              break;
            }
          }
        }
      }

      if (currentPrice === undefined || currentPrice === null) {
        Logger.log(`${symbol}の価格が取得できませんでした`);
        return 0;
      }

      Logger.log(`${symbol}の最新価格: ${currentPrice}`);
      return parseFloat(currentPrice);

    } catch (error) {
      Logger.log(`取得エラー (${symbol}): ${error.message}`);
      return 0;
    }
  }
}

/**
 * 価格監視ロジック
 */
class PriceMonitor {
  constructor(priceProvider) {
    this.priceProvider = priceProvider;
  }

  checkPriceTarget(item, currentPrice) {
    const { symbol, target, isUpperTarget, unit } = item;

    // 表示用シンボルの調整（=Xなどを取って見やすくする）
    const displaySymbol = symbol.replace("=X", "").replace("-USD", "");

    const shouldNotify = isUpperTarget
      ? currentPrice >= target
      : currentPrice <= target;

    if (!shouldNotify) {
      return null;
    }

    const direction = isUpperTarget ? "上回りました↑↑🎉" : "下回りました↓↓🎉";
    return `${displaySymbol}の価格が${target}${unit}を${direction} (${currentPrice}${unit})`;
  }

  processItem(item) {
    try {
      const price = this.priceProvider.getPrice(item);
      if (price === 0) return null;
      return this.checkPriceTarget(item, price);
    } catch (error) {
      Logger.log(`${item.symbol}の処理中にエラー: ${error.message}`);
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

  sendNotification(message) {
    if (!this.webhookUrl) return;

    const payload = { text: message };
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

  createTask(content) {
    if (!this.apiKey) return;

    const payload = {
      content: content,
      due_string: "Today",
      priority: 4,
      project_id: CONFIG.TODO_PROJECT_ID,
    };

    const options = {
      method: "POST",
      contentType: "application/json",
      headers: { Authorization: `Bearer ${this.apiKey}` },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    };

    try {
      UrlFetchApp.fetch(this.apiUrl, options);
      Logger.log("Todoistタスク作成成功");
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
 * メインシステム
 */
class PriceMonitoringSystem {
  constructor() {
    this.priceProvider = new PriceProvider();
    this.priceMonitor = new PriceMonitor(this.priceProvider);
    this.slackNotifier = new SlackNotifier();
    this.todoistTaskCreator = new TodoistTaskCreator();
  }

  run() {
    if (isWeekend()) {
      Logger.log("今日は週末です。処理をスキップします。");
      return;
    }

    const results = this.processWatchList();
    this.sendNotifications(results);
  }

  processWatchList() {
    return WATCH_LIST.map((item) => this.priceMonitor.processItem(item)).filter(
      (notification) => notification !== null
    );
  }

  sendNotifications(notifications) {
    notifications.forEach((notification) => {
      Logger.log(notification);
      this.slackNotifier.sendNotification(notification);
      this.todoistTaskCreator.createTask(notification);
    });
  }
}

/**
 * メイン実行関数
 */
function checkAndSendNotifications() {
  const system = new PriceMonitoringSystem();
  system.run();
}