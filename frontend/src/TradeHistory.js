import React from "react";
import { Table, Typography } from "antd";

const { Title } = Typography;

const TradeHistory = ({ trades }) => {
    const columns = [
        {
            title: "账户号",
            dataIndex: "account_id",
            key: "account_id",
            sorter: (a, b) => a.account_id.localeCompare(b.account_id),
        },
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
            filters: [...new Set(trades.map(trade => trade.symbol))].map(symbol => ({
                text: symbol,
                value: symbol,
            })),
            onFilter: (value, record) => record.symbol === value,
        },
        {
            title: "方向",
            dataIndex: "direction",
            key: "direction",
            render: direction => direction === "buy" ? "📈 买入" : "📉 卖出",
        },
        {
            title: "交易量",
            dataIndex: "lot_size",
            key: "lot_size",
            sorter: (a, b) => a.lot_size - b.lot_size,
        },
        {
            title: "开仓价",
            dataIndex: "open_price",
            key: "open_price",
            render: price => price ? Number(price).toFixed(2) : "0.00",
        },
        {
            title: "策略使用",
            dataIndex: "strategy_code",
            key: "strategy_code",
        },
        {
            title: "平仓价",
            dataIndex: "close_price",
            key: "close_price",
            render: price => price ? Number(price).toFixed(2) : "0.00",
        },
        {
            title: "收益率",
            dataIndex: "profit_ratio",
            key: "profit_ratio",
            render: profit => {
                let color = "black"; 
                if (profit > 0) color = "green"; 
                if (profit < 0) color = "red"; 
                return <span style={{ color }}>{(profit * 100).toFixed(4)}%</span>;
            },
            sorter: (a, b) => a.profit_ratio - b.profit_ratio,
        },
        {
            title: "备注",
            dataIndex: "comment",
            key: "comment",
        },
    ];

  
    const rowClassName = (record) => {
        return !record.lot_size || isNaN(record.lot_size) ? "row-red" : "NaN";
    };

    return (
        <div style={{ 
            marginTop: "50px", 
            minWidth: "1300px", 
            display: "flex", 
            flexDirection: "column",  // 让子元素垂直排列
            alignItems: "center",  // 水平居中
        }}>
            <Title level={3} style={{ textAlign: "center" }}>📊 最新十笔成交记录</Title>
            <Table 
                columns={columns} 
                dataSource={trades.map((trade, index) => ({ ...trade, key: index }))} 
                pagination={{ pageSize: 10 }}
                bordered
                rowClassName={rowClassName}  
                style={{ width: "90%", maxWidth: "1400px" }}  
            />
        </div>
    );
};

export default TradeHistory;

