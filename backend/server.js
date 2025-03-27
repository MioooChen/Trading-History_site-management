const express = require("express");
const cors = require("cors");
require('dotenv').config();
const { Pool } = require('pg');
const WebSocket = require("ws");

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
})

const wss = new WebSocket.Server({ port: 8080 });

// ✅ **添加 WebSocket 连接数限制**
let activeConnections = 0;
const MAX_CONNECTIONS = 100; // 🚨 设定最大连接数

// 🔹 WebSocket 连接处理
wss.on("connection", (ws) => {
    if (activeConnections >= MAX_CONNECTIONS) {
        console.log("❌ 连接被拒绝，达到最大连接数");
        ws.close(); // 超过限制，直接断开连接
        return;
    }

    activeConnections++; // 连接数 +1
    console.log(`🔗 新的 WebSocket 连接，当前连接数: ${activeConnections}`);

    // **当连接关闭时，减少计数**
    ws.on("close", () => {
        activeConnections--;
        console.log(`❌ 连接已关闭，当前连接数: ${activeConnections}`);
    });

    ws.on("error", (err) => {
        console.error("⚠️ WebSocket 发生错误:", err);
    });

    // 定时推送最新数据（每 5 秒）
    const interval = setInterval(async () => {
        try {
            let monthlyStats = { total_trades: 0, accuracy: 0, profit_ratio: 0 };
            let yearlyStats = { total_trades: 0, accuracy: 0, profit_ratio: 0 };

            // **获取本月交易情况**
            const monthlyStatsResult = await pool.query(`
                WITH current_month_trades AS (  -- 只筛选当月的交易
                    SELECT * 
                    FROM trades
                    WHERE DATE_TRUNC('month', open_time) = DATE_TRUNC('month', CURRENT_DATE)
                ),
                ranked_trades AS (
                    SELECT 
                        account_id,
                        strategy_code,
                        profit,
                        profit_ratio,
                        CASE 
                            WHEN profit < 0 THEN 1 ELSE 0 END AS loss_flag,
                        LAG(profit) OVER (PARTITION BY account_id, strategy_code ORDER BY open_time) AS prev_profit,
                        open_time
                    FROM current_month_trades
                ),
                loss_grouped AS (
                    SELECT 
                        *,
                        CASE 
                            WHEN prev_profit IS NOT NULL AND prev_profit < 0 THEN 0 ELSE 1 
                        END AS loss_group_start
                    FROM ranked_trades
                ),
                grouped_losses AS (
                    SELECT 
                        account_id, 
                        strategy_code,
                        SUM(loss_group_start) OVER (PARTITION BY account_id, strategy_code ORDER BY open_time) AS loss_group,
                        loss_flag
                    FROM loss_grouped
                ),
                loss_counts AS (
                    SELECT 
                        account_id, 
                        strategy_code, 
                        loss_group,
                        COUNT(*) AS loss_streak
                    FROM grouped_losses
                    WHERE loss_flag = 1
                    GROUP BY account_id, strategy_code, loss_group
                ),
                max_loss_streak AS (
                    SELECT 
                        account_id,
                        strategy_code,
                        MAX(loss_streak) AS max_consecutive_losses
                    FROM loss_counts
                    GROUP BY account_id, strategy_code
                    ORDER BY max_consecutive_losses DESC
                    LIMIT 1
                ),
                profit_curve AS (
                    SELECT 
                        account_id, 
                        strategy_code, 
                        open_time, 
                        SUM(profit_ratio) OVER (PARTITION BY account_id, strategy_code ORDER BY open_time) AS cumulative_profit_ratio 
                    FROM current_month_trades
                ),
                drawdowns AS (
                    SELECT 
                        account_id, 
                        strategy_code, 
                        open_time, 
                        cumulative_profit_ratio, 
                        MAX(cumulative_profit_ratio) OVER (PARTITION BY account_id, strategy_code ORDER BY open_time) AS max_historical_profit,
                        cumulative_profit_ratio - MAX(cumulative_profit_ratio) OVER (PARTITION BY account_id, strategy_code ORDER BY open_time) AS drawdown
                    FROM profit_curve
                ),
                max_drawdown AS (
                    SELECT 
                        account_id, 
                        strategy_code, 
                        MIN(drawdown) AS max_drawdown  -- 取最小值，即最大回撤
                    FROM drawdowns
                    GROUP BY account_id, strategy_code
                ),
                global_trade_stats AS (  -- **全局总统计（当月）**
                    SELECT 
                        COUNT(*) AS total_trades,  -- **当月所有交易总数**
                        SUM(CASE WHEN profit > 0 THEN 1 ELSE 0 END) * 100.0 / COUNT(*) AS accuracy,  -- **当月正确率**
                        SUM(profit_ratio) AS total_profit_ratio  -- **当月所有订单的收益率之和**
                    FROM current_month_trades
                )
                SELECT 
                    m.max_consecutive_losses,  -- **最大连续亏损次数（当月）**
                    g.total_trades,  -- **当月所有交易总数**
                    g.accuracy,  -- **当月正确率**
                    g.total_profit_ratio,  -- **当月所有订单的收益率之和**
                    d.max_drawdown  -- **最大回撤（当月）**
                FROM max_loss_streak m
                JOIN max_drawdown d ON m.account_id = d.account_id AND m.strategy_code = d.strategy_code
                CROSS JOIN global_trade_stats g;

            `);

            // **获取今年的交易数据**
            const yearlyStatsResult = await pool.query(`
                 WITH ranked_trades AS (
                    SELECT 
                        account_id,
                        strategy_code,
                        profit,
                        profit_ratio,
                        CASE 
                            WHEN profit < 0 THEN 1 ELSE 0 END AS loss_flag,
                        LAG(profit) OVER (PARTITION BY account_id, strategy_code ORDER BY open_time) AS prev_profit,
                        open_time
                    FROM trades
                ),
                loss_grouped AS (
                    SELECT 
                        *,
                        CASE 
                            WHEN prev_profit IS NOT NULL AND prev_profit < 0 THEN 0 ELSE 1 
                        END AS loss_group_start
                    FROM ranked_trades
                ),
                grouped_losses AS (
                    SELECT 
                        account_id, 
                        strategy_code,
                        SUM(loss_group_start) OVER (PARTITION BY account_id, strategy_code ORDER BY open_time) AS loss_group,
                        loss_flag
                    FROM loss_grouped
                ),
                loss_counts AS (
                    SELECT 
                        account_id, 
                        strategy_code, 
                        loss_group,
                        COUNT(*) AS loss_streak
                    FROM grouped_losses
                    WHERE loss_flag = 1
                    GROUP BY account_id, strategy_code, loss_group
                ),
                max_loss_streak AS (
                    SELECT 
                        account_id,
                        strategy_code,
                        MAX(loss_streak) AS max_consecutive_losses
                    FROM loss_counts
                    GROUP BY account_id, strategy_code
                    ORDER BY max_consecutive_losses DESC
                    LIMIT 1
                ),
                profit_curve AS (
                    SELECT 
                        account_id, 
                        strategy_code, 
                        open_time, 
                        SUM(profit_ratio) OVER (PARTITION BY account_id, strategy_code ORDER BY open_time) AS cumulative_profit_ratio 
                    FROM trades
                ),
                drawdowns AS (
                    SELECT 
                        account_id, 
                        strategy_code, 
                        open_time, 
                        cumulative_profit_ratio, 
                        MAX(cumulative_profit_ratio) OVER (PARTITION BY account_id, strategy_code ORDER BY open_time) AS max_historical_profit,
                        cumulative_profit_ratio - MAX(cumulative_profit_ratio) OVER (PARTITION BY account_id, strategy_code ORDER BY open_time) AS drawdown
                    FROM profit_curve
                ),
                max_drawdown AS (
                    SELECT 
                        account_id, 
                        strategy_code, 
                        MIN(drawdown) AS max_drawdown  -- 取最小值，即最大回撤
                    FROM drawdowns
                    GROUP BY account_id, strategy_code
                ),
                global_trade_stats AS (  -- **全局总统计**
                    SELECT 
                        COUNT(*) AS total_trades,  -- **所有交易总数**
                        SUM(CASE WHEN profit > 0 THEN 1 ELSE 0 END) * 100.0 / COUNT(*) AS accuracy,  -- **正确率**
                        SUM(profit_ratio) AS total_profit_ratio  -- **所有订单的收益率之和**
                    FROM trades
                )
                SELECT 
                    m.max_consecutive_losses,  -- **最大连续亏损次数**
                    g.total_trades,  -- **所有交易总数**
                    g.accuracy,  -- **正确率**
                    g.total_profit_ratio,  -- **所有订单的收益率之和**
                    d.max_drawdown  -- **最大回撤**
                FROM max_loss_streak m
                JOIN max_drawdown d ON m.account_id = d.account_id AND m.strategy_code = d.strategy_code
                CROSS JOIN global_trade_stats g;
            `);
            if (monthlyStatsResult.rows.length > 0) {
                monthlyStats = monthlyStatsResult.rows[0];
            }
            if (yearlyStatsResult.rows.length > 0) {
                yearlyStats = yearlyStatsResult.rows[0];
            }

            // 查询所有唯一账户 ID
            const uniqueAccountsQuery = await pool.query(`
                SELECT DISTINCT account_id FROM trades;
            `);
            const uniqueSymbolsQuery = await pool.query(`
                SELECT DISTINCT symbol FROM trades;
            `);


            /// 🔹 获取最新 10 笔成交记录
            const tradesResult = await pool.query(`
                SELECT 
                    account_id, open_time_au, symbol, direction, lot_size, 
                    open_price, close_price, strategy_code, order_status, profit_ratio, comment
                FROM trades
                WHERE order_status <> 'open'  -- 过滤掉未平仓交易
                ORDER BY open_time_au DESC  -- 按开仓时间排序，获取最新的交易
                LIMIT 10;
            `);

            // 🔹 获取当前持仓
            const positionsResult = await pool.query(`
                SELECT 
                    account_id, open_time_au, symbol, direction, lot_size, 
                    open_price, close_price, strategy_code, order_status, profit_ratio, comment
                FROM trades
                WHERE order_status = 'open' -- 只取未平仓的交易
                ORDER BY open_time_au DESC;
            `);
            
            const trades = tradesResult.rows || [];
            const positions = positionsResult.rows || [];


            // 🔹 查询账户数
            const accountCountResult = await pool.query(`
                SELECT COUNT(DISTINCT mt4_id) AS account_count FROM accounts;
            `);

            // 🔹 查询策略数
            const strategyCountResult = await pool.query(`
                SELECT COUNT(DISTINCT strategy_code) AS strategy_count FROM strategy_modeling_data;
            `);

            const accountsQuery = await pool.query(`
                WITH first_deposits AS (
                SELECT DISTINCT ON (account_id) account_id, amount AS initial_capital
                FROM transactions
                WHERE transaction_type = 'deposit' AND amount > 0
                ORDER BY account_id, created_at ASC
            )

            SELECT 
                a.mt4_id AS account_number,
                a.broker AS platform,
                a.account_type,
                TO_CHAR(a.created_at, 'YYYY年MM月DD日') AS created_at,
                a.using_strategy AS current_strategy,
                a.symbol AS trade_symbols,
                fd.initial_capital  
            FROM accounts a
            LEFT JOIN first_deposits fd ON a.mt4_id = fd.account_id;

            `);
            
            // 🔹 获取所有已平仓交易
            const allTradesResult = await pool.query(`
                SELECT 
                    account_id, open_time_au, symbol, direction, lot_size, 
                    open_price, close_price, profit_ratio, order_status
                FROM trades
                WHERE order_status <> 'open' 
                ORDER BY open_time_au DESC;
            `);

            const strategyQuery = await pool.query(`
                SELECT 
                    strategy_code, -- AS strategy_number,
                    strategy_type,
                    strategy_status,
                    CASE 
                        WHEN strategy_code LIKE '%DJ30%' THEN 'DJ30'
                        ELSE 'GER40'
                    END AS trade_target,
                    CASE 
                        WHEN modeling_period_start IS NOT NULL AND modeling_period_end IS NOT NULL 
                        THEN TO_CHAR(modeling_period_start, 'YYYY.MM.DD HH24:MI:SS') || ' - ' || 
                             TO_CHAR(modeling_period_end, 'YYYY.MM.DD HH24:MI:SS')
                        ELSE '-'
                    END AS modeling_period,
                    COALESCE(trade_count, 0) AS trade_count,
                    COALESCE(accuracy_1, 0) AS accuracy
                FROM strategy_modeling_data;
            `);
            
            // **📡 调试日志**
            // console.log("📡 WebSocket 推送数据:");
            // console.log("📊 本月交易情况 :", monthlyStats);
            // console.log("📅 今年交易情况:", yearlyStats);
            // console.log("📄 最新 10 笔成交:", trades);
            // console.log("📈 当前持仓 :", positions);



            ws.send(JSON.stringify({
                monthly: monthlyStats,
                yearly: yearlyStats,
                unique_accounts: uniqueAccountsQuery.rows,
                unique_symbols: uniqueSymbolsQuery.rows.map(row => row.symbol),
                trades: trades.length > 0 ? trades : [],
                positions: positions.length > 0 ? positions : [],
                account_count: accountCountResult.rows[0].account_count,
                strategy_count: strategyCountResult.rows[0].strategy_count,
                accounts: accountsQuery.rows,
                all_trades: allTradesResult.rows,
                strategies: strategyQuery.rows,
            
            }));
        } catch (err) {
            console.error("❌ WebSocket 数据推送失败:", err);
        }
    }, 5000); 


    ws.on("message", async (message) => {
        try {
            const data = JSON.parse(message);

            // 这是homepage上面 第一个筛选组件的 
            if (data.request_filtered_trades) {
                const { startDate, endDate, selectedAccount, selectedSymbols, selectedStrategyCodes} = data.request_filtered_trades;
    
                console.log("📡 收到交易筛选请求:", data.request_filtered_trades);
    
                let filterQuery = `
                    SELECT 
                        account_id, open_time_au, symbol, direction, lot_size, 
                        open_price, close_price, strategy_code, order_status, profit_ratio, comment
                    FROM trades
                    WHERE order_status <> 'open'
                `;
                const queryParams = [];
    
                if (startDate) {
                    filterQuery += ` AND open_time >= $${queryParams.length + 1}`;
                    queryParams.push(startDate);
                }
                if (endDate) {
                    filterQuery += ` AND open_time <= $${queryParams.length + 1}`;
                    queryParams.push(endDate);
                }
                if (selectedAccount) {
                    filterQuery += ` AND account_id = $${queryParams.length + 1}`;
                    queryParams.push(selectedAccount);
                }
                // ✅ **多选标的筛选**
                if (selectedSymbols && selectedSymbols.length > 0) {
                    filterQuery += ` AND symbol = ANY($${queryParams.length + 1}::TEXT[])`;
                    queryParams.push(selectedSymbols);
                }

                // ✅ **多选策略筛选**
                if (selectedStrategyCodes && selectedStrategyCodes.length > 0) {
                    filterQuery += ` AND strategy_code = ANY($${queryParams.length + 1}::TEXT[])`;
                    queryParams.push(selectedStrategyCodes);
                }
    
                filterQuery += ` ORDER BY open_time_au DESC;`;
    
                const filteredTradesQuery = await pool.query(filterQuery, queryParams);
    
                ws.send(JSON.stringify({
                    filtered_trades: filteredTradesQuery.rows || []
                }));
            }
        // 策略详情筛选的
        else if (data.request_strategy_details) {
                const requestedStrategyCode = data.request_strategy_details;

                console.log("📡 收到策略详情请求:", requestedStrategyCode);

                const strategyDetailQuery = await pool.query(`
                    SELECT 
                        t.strategy_code AS strategy_number,
                        t.position_id AS trade_id,
                        t.order_status,
                        TO_CHAR(t.open_time_au, 'YYYY.MM.DD HH24:MI:SS') AS trade_time,
                        t.direction,
                        t.lot_size,
                        t.symbol
                    FROM trades t
                    WHERE t.strategy_code = $1
                    ORDER BY t.open_time DESC;
                `, [requestedStrategyCode]);

                const strategyFilesQuery = await pool.query(`
                    SELECT 
                        strategy_code
                    FROM strategy_modeling_data
                    WHERE strategy_code = $1;
                `, [requestedStrategyCode]);

                ws.send(JSON.stringify({
                    strategy_details: strategyFilesQuery.rows[0] || {},
                    strategy_trades: strategyDetailQuery.rows
                }));
            }
        } catch (err) {
            console.error("❌ WebSocket 数据推送失败:", err);
        }
    });

    ws.on("close", () => {
        clearInterval(interval);
        console.log("❌ WebSocket 连接已断开");
    });
});





const PORT = process.env.PORT || 5000;  // ✅ 让端口可配置
app.listen(PORT, "0.0.0.0", () => {  // ✅ 监听 `0.0.0.0` 让外部设备可以访问
    console.log(`✅ 服务器运行在 http://0.0.0.0:${PORT}`);
});


