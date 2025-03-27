import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Button, Table, Spin, Typography, Tag } from "antd";

const { Title, Text } = Typography;
const WS_URL = process.env.REACT_APP_WS_URL || "ws://localhost:8080";


const AccountDetail = () => {
    const { accountNumber } = useParams();  
    const [account, setAccount] = useState(null);
    const [trades, setTrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const ws = new WebSocket(WS_URL);

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log("📡 WebSocket 数据:", data);

            const foundAccount = data.accounts.find(acc => acc.account_number === accountNumber);
            setAccount(foundAccount || null);

            if (data.all_trades && Array.isArray(data.all_trades)) {
                const accountTrades = data.all_trades.filter(trade => {
                    console.log("🔎 筛选交易 - account_id:", trade.account_id, "order_status:", trade.order_status);
                    return String(trade.account_id) === String(accountNumber) && trade.order_status === 'closed';
                });

                setTrades(accountTrades);
            } else {
                setTrades([]);  // 避免 all_trades 为空时报错
            }
            setLoading(false);
        };

        return () => ws.close();
    }, [accountNumber]);

    if (loading) {
        return <Spin size="large" style={{ display: "flex", justifyContent: "center", marginTop: "20px" }} />;
    }

    if (!account) {
        return <h2 style={{ textAlign: "center", marginTop: "20px" }}>🚫 找不到账户信息...</h2>;
    }

    const columns = [
        {
            title: "开单时间",
            dataIndex: "open_time_au",
            key: "open_time_au",
            sorter: (a, b) => new Date(a.open_time) - new Date(b.open_time),
        },
        {
            title: "品种",
            dataIndex: "symbol",
            key: "symbol",
        },
        {
            title: "方向",
            dataIndex: "direction",
            key: "direction",
            render: direction => (
                <Tag color={direction === "buy" ? "green" : "red"}>
                    {direction === "buy" ? "📈 买入" : "📉 卖出"}
                </Tag>
            ),
        },
        {
            title: "交易量",
            dataIndex: "lot_size",
            key: "lot_size",
            sorter: (a, b) => a.lot_size - b.lot_size,
        },
        {
            title: "开单价格",
            dataIndex: "open_price",
            key: "open_price",
            render: price => price ? Number(price).toFixed(2) : "0.00",
        },
        {
            title: "平仓价格",
            dataIndex: "close_price",
            key: "close_price",
            render: price => price ? Number(price).toFixed(2) : "0.00",
        },
        {
            title: "收益率",
            dataIndex: "profit_ratio",
            key: "profit_ratio",
            render: profit => (
                <span style={{ color: profit >= 0 ? "green" : "red", fontWeight: "bold" }}>
                    {(profit * 100).toFixed(2)}%
                </span>
            ),
            sorter: (a, b) => a.profit_ratio - b.profit_ratio,
        },
    ];

    return (
        <div style={{ padding: "20px", maxWidth: "900px", margin: "auto" }}>
            <Button type="primary" onClick={() => navigate(-1)} style={{ marginBottom: "20px" }}>
                🔙 返回
            </Button>

            <Card bordered>
                <Title level={3}>📂 账户详情</Title>
                <Text><strong>账户号:</strong> {account.account_number}</Text><br />
                <Text><strong>平台:</strong> {account.platform}</Text><br />
                <Text><strong>账户类型:</strong> {account.account_type}</Text><br />
                <Text><strong>创建时间:</strong> {account.created_at}</Text><br />
                <Text><strong>当前策略:</strong> {account.current_strategy || "无"}</Text><br />
                <Text><strong>交易标的:</strong> {account.trade_symbols}</Text><br />
                <Text><strong>初始资本金:</strong> {account.initial_capital ? `$${Number(account.initial_capital).toFixed(2)}` : "$0.00"}</Text>
            </Card>

            <Title level={3} style={{ marginTop: "20px" }}>📊 交易记录</Title>
            <Table 
                columns={columns} 
                dataSource={trades.map((trade, index) => ({ ...trade, key: index }))} 
                pagination={{ pageSize: 10 }}
                bordered
            />
        </div>
    );
};

export default AccountDetail;
