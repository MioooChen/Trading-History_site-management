import React, { useEffect, useState } from "react";
import { Table, Typography, Spin, Tag } from "antd";

const { Title } = Typography;
const WS_URL = process.env.REACT_APP_WS_URL || "ws://localhost:8080";

const OpenPositions = () => {
    const [positions, setPositions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const ws = new WebSocket(WS_URL);

        ws.onopen = () => {
            console.log("🔗 WebSocket 连接已建立");
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.positions) {
                console.log("📡 收到持仓数据:", data.positions);
                setPositions(data.positions); 
                setLoading(false);
            }
        };

        ws.onerror = (error) => {
            console.error("❌ WebSocket 发生错误:", error);
            setLoading(false);
        };

        ws.onclose = () => {
            console.log("❌ WebSocket 连接已断开");
        };

        return () => ws.close();
    }, []);

    const columns = [
        {
            title: "账户号",
            dataIndex: "account_id",
            key: "account_id",
            sorter: (a, b) => a.account_id - b.account_id, 
        },
        {
            title: "开单时间",
            dataIndex: "open_time_au",
            key: "open_time_au",
            sorter: (a, b) => new Date(a.open_time_au) - new Date(b.open_time_au),
        },
        {
            title: "品种",
            dataIndex: "symbol",
            key: "symbol",
            filters: [...new Set(positions.map(pos => pos.symbol))].map(symbol => ({
                text: symbol,
                value: symbol,
            })),
            onFilter: (value, record) => record.symbol === value,
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
            title: "策略使用",
            dataIndex: "strategy_code",
            key: "strategy_code",
        },
    ];

    return (
        <div style={{ 
            marginTop: "50px", 
            maxWidth: "1100px",  
            width: "100%",  
            display: "flex", 
            flexDirection: "column",  
            alignItems: "center",
        }}>
            <Title level={3} style={{ textAlign: "center", marginBottom: "20px" }}>
                📌 当前持仓
            </Title>
    
            {loading ? (
                <Spin size="large" style={{ display: "flex", justifyContent: "center", margin: "20px 0" }} />
            ) : (
                <Table 
                    columns={columns} 
                    dataSource={positions.map((pos, index) => ({ ...pos, key: index }))} 
                    pagination={{ pageSize: 10 }}
                    bordered
                    style={{ 
                        width: "100%",  
                        minWidth: "1000px",  
                    }}
                    scroll={{ x: "100%" }}  
                />
            )}
        </div>
    );
    
};

export default OpenPositions;