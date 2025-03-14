import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

const Charts = () => {
    const [data, setData] = useState([]);

    useEffect(() => {
        axios.get('http://localhost:5000/api/trades')
            .then(res => {
                const chartData = res.data.map(trade => ({
                    date: new Date(trade.open_time).toLocaleDateString(),
                    profit: trade.profit
                }));
                setData(chartData);
            })
            .catch(err => console.error("❌ 获取数据失败:", err));
    }, []);

    return (
        <div>
            <h2>交易利润趋势</h2>
            <ResponsiveContainer width="100%" height={400}>
                <LineChart data={data}>
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <CartesianGrid stroke="#ccc" />
                    <Line type="monotone" dataKey="profit" stroke="#8884d8" />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default Charts;
