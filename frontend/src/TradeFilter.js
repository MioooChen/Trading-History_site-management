import React, { useEffect, useState, useRef } from "react";
import { DatePicker, Select, Button, Card, Table, Empty } from "antd";

const { RangePicker } = DatePicker;

const WS_URL = process.env.REACT_APP_WS_URL || "ws://localhost:8080";

const TradeFilter = () => {
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [selectedSymbols, setSelectedSymbols] = useState([]);
    const [selectedStrategyCodes, setSelectedStrategyCodes] = useState([]);  // ✅ 支持多选

    const [accounts, setAccounts] = useState([]); // ✅ 账户列表
    const [symbols, setSymbols] = useState([]);  // ✅ 交易标的
    const [strategies, setStrategies] = useState([]);  // ✅ 策略列表 (修正)

    const [filteredTrades, setFilteredTrades] = useState(null); // ✅ 保持筛选结果
    const ws = useRef(null);

    useEffect(() => {
        ws.current = new WebSocket(WS_URL);

        ws.current.onopen = () => console.log("🔗 WebSocket 已连接");

        ws.current.onmessage = (event) => {
            const data = JSON.parse(event.data);

            // ✅ 只监听 `filtered_trades`
            if (data.filtered_trades) {
                console.log("📊 收到筛选交易数据:", data.filtered_trades);
                setFilteredTrades(data.filtered_trades);
            }

            // ✅ 监听账户 & 交易标的
            if (data.all_trades) {
                setAccounts([...new Set(data.all_trades.map(trade => trade.account_id))]);
                setSymbols([...new Set(data.all_trades.map(trade => trade.symbol))]);
            }

            if (data.strategies) {
                setStrategies([...new Set(data.strategies.map(strategy => strategy.strategy_code))]);
            }
        };

        ws.current.onclose = () => console.log("❌ WebSocket 连接关闭");

        return () => ws.current.close(); // 
    }, []);

    
    const handleFilter = () => {
        if (!ws.current) return;

        ws.current.send(JSON.stringify({
            request_filtered_trades: {
                startDate,
                endDate,
                selectedAccount,
                selectedSymbols: selectedSymbols.length > 0 ? selectedSymbols : null,  // ✅ 避免空数组
                selectedStrategyCodes: selectedStrategyCodes.length > 0 ? selectedStrategyCodes : null,  // ✅ 避免空数组
            }
        }));
    };

    
    const columns = [
        { title: "开单时间", dataIndex: "open_time_au", key: "open_time_au" },
        { title: "品种", dataIndex: "symbol", key: "symbol" },
        { title: "方向", dataIndex: "direction", key: "direction" },
        { title: "交易量", dataIndex: "lot_size", key: "lot_size" },
        { title: "开单价格", dataIndex: "open_price", key: "open_price" },
        { title: "平仓价格", dataIndex: "close_price", key: "close_price" },
        { title: "策略使用", dataIndex: "strategy_code", key: "strategy_code" },
        
        { 
            title: "收益率", 
            dataIndex: "profit_ratio", 
            key: "profit_ratio",
            render: (value) => `${(value * 100).toFixed(2)}%` 
        },
        { title: "订单状态", dataIndex: "order_status", key: "order_status" },
        { title: "备注", dataIndex: "comment", key: "comment" },
    ];

    return (
        <div style={{ marginBottom: "20px" }}>
            <Card title="🔎 交易筛选" bordered style={{ padding: "16px", marginTop: "50px", 
                                                        minWidth: "1100px", 
                                                        display: "flex", 
                                                        flexDirection: "column",  // 让子元素垂直排列
                                                        alignItems: "center",  }}>
                <div style={{
                    display: "flex", 
                    flexWrap: "wrap", // ✅ 小屏幕时换行
                    alignItems: "center",
                    gap: "12px" // ✅ 控制组件间距
                }}>
                    <RangePicker 
                        onChange={(dates, dateStrings) => {
                            setStartDate(dateStrings[0]);
                            setEndDate(dateStrings[1]);
                        }} 
                    />

                    <Select
                        placeholder="选择账户"
                        onChange={setSelectedAccount}
                        style={{ width: 180 }}
                    >
                        {accounts.map(account => (
                            <Select.Option key={account} value={account}>
                                {account}
                            </Select.Option>
                        ))}
                    </Select>

                    <Select
                        mode="multiple"  
                        placeholder="选择标的"
                        onChange={setSelectedSymbols}
                        style={{ width: 200 }}
                    >
                        {symbols.map(symbol => (
                            <Select.Option key={symbol} value={symbol}>
                                {symbol}
                            </Select.Option>
                        ))}
                    </Select>

                    <Select
                        mode="multiple"  
                        placeholder="选择策略"
                        onChange={setSelectedStrategyCodes}
                        style={{ width: 200 }}
                    >
                        {strategies.map(strategy => (
                            <Select.Option key={strategy} value={strategy}>
                                {strategy}
                            </Select.Option>
                        ))}
                    </Select>

                    <Button onClick={handleFilter} type="primary">
                        筛选
                    </Button>
                </div>
            </Card>


            
            <Card title="📊 筛选交易结果" style={{ marginTop: "50px", 
                                                    minWidth: "1100px", 
                                                    display: "flex", 
                                                    flexDirection: "column",  // 让子元素垂直排列
                                                    alignItems: "center" }}>
                {filteredTrades === null ? (
                    <p>🔍 请选择筛选条件并点击筛选</p>
                ) : filteredTrades.length === 0 ? (
                    <Empty description="❌ 没有交易记录" />
                ) : (
                    <Table 
                        dataSource={filteredTrades} 
                        columns={columns} 
                        rowKey="open_time"
                        pagination={{ pageSize: 5 }}
                        scroll={{ x: "max-content" }}  
                    />
                )}
            </Card>
        </div>
    );
};

export default TradeFilter;
