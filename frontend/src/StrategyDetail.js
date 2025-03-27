import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Button, Table, Spin, Typography, Tag } from "antd";

const { Title, Text } = Typography;
const WS_URL = process.env.REACT_APP_WS_URL || "ws://localhost:8080";

const StrategyDetail = () => {
    const { strategyNumber } = useParams();  
    const navigate = useNavigate();
    
    const [strategy, setStrategy] = useState(null);
    const [trades, setTrades] = useState([]); 
    const [isDataLoaded, setIsDataLoaded] = useState(false); 

    useEffect(() => {
        const ws = new WebSocket(WS_URL);

        ws.onopen = () => {
            ws.send(JSON.stringify({ request_strategy_details: strategyNumber }));
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.strategy_details) {
                setStrategy(data.strategy_details);
            }

            if (data.strategy_trades && data.strategy_trades.length > 0) {
                setTrades(data.strategy_trades);
                setIsDataLoaded(true);  
            } else if (!isDataLoaded) {
                setTrades([]);  
            }
        };

        return () => ws.close();
    }, [strategyNumber, isDataLoaded]);

    if (!strategy) {
        return <Spin size="large" style={{ display: "flex", justifyContent: "center", marginTop: "20px" }} />;
    }

    const columns = [
        {
            title: "策略号",
            dataIndex: "strategy_number",
            key: "strategy_number",
        },
        {
            title: "单号",
            dataIndex: "trade_id",
            key: "trade_id",
        },
        {
            title: "状态",
            dataIndex: "order_status",
            key: "order_status",
            render: (status) => {
                let color = status === "closed" ? "green" : status === "open" ? "orange" : "red";
                return <Tag color={color}>{status}</Tag>;
            },
        },
        {
            title: "时间",
            dataIndex: "trade_time",
            key: "trade_time",
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
            title: "金额(手)",
            dataIndex: "lot_size",
            key: "lot_size",
        },
        {
            title: "标的",
            dataIndex: "symbol",
            key: "symbol",
        },
    ];

    return (
        <div style={{ padding: "20px", maxWidth: "900px", margin: "auto" }}>
            <Button type="primary" onClick={() => navigate("/strategies")} style={{ marginBottom: "20px" }}>
                🔙 返回策略管理
            </Button>

            <Card bordered>
                <Title level={3}>📊 策略详情</Title>
                <Text><strong>策略号:</strong> {strategyNumber}</Text><br />
            </Card>

            <Title level={3} style={{ marginTop: "20px" }}>📈 实盘交易记录</Title>
            <Table 
                columns={columns} 
                dataSource={trades.map((trade, index) => ({ ...trade, key: index }))} 
                pagination={{ pageSize: 10 }}
                bordered
            />
        </div>
    );
};

export default StrategyDetail;
