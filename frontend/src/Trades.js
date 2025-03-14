import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Trades = () => {
    const [trades, setTrades] = useState([]);

    useEffect(() => {
        axios.get('http://localhost:5000/api/trades')
            .then(res => setTrades(res.data))
            .catch(err => console.error("❌ 获取数据失败:", err));
    }, []);

    return (
        <div>
            <h2>交易记录</h2>
            <table border="1">
                <thead>
                    <tr>
                        <th>账户ID</th>
                        <th>订单ID</th>
                        <th>交易品种</th>
                        <th>方向</th>
                        <th>交易手数</th>
                        <th>开仓时间</th>
                        <th>开仓价格</th>
                        <th>平仓时间</th>
                        <th>平仓价格</th>
                        <th>利润</th>
                    </tr>
                </thead>
                <tbody>
                    {trades.map((trade, index) => (
                        <tr key={index}>
                            <td>{trade.account_id}</td>
                            <td>{trade.order_id}</td>
                            <td>{trade.symbol}</td>
                            <td>{trade.direction}</td>
                            <td>{trade.lot_size}</td>
                            <td>{new Date(trade.open_time).toLocaleString()}</td>
                            <td>{trade.open_price}</td>
                            <td>{new Date(trade.close_time).toLocaleString()}</td>
                            <td>{trade.close_price}</td>
                            <td style={{ color: trade.profit >= 0 ? 'green' : 'red' }}>{trade.profit}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Trades;
