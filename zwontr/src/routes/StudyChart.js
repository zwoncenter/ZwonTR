import { Form, Button, Card, ListGroup, Table, Modal, Row, Col } from "react-bootstrap";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import TimePicker from "react-time-picker";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from "recharts";
import "./StudyChart.scss";

function StudyChart(props) {
  let history = useHistory();

  const managerList = props.managerList;
  const [stuDB, setstuDB] = useState(props.stuDB);
  const [data, setdata] = useState(props.trList);

  const [startday, setstartday] = useState(props.trList[props.trList.length - 1].날짜);
  const [lastday, setlastday] = useState(props.trList[0].날짜);
  const [aver, setaver] = useState(0);
  const [include, setinclude] = useState(true);

  useEffect(() => {
    var newdata = [...props.trList];

    if (!include) {
      newdata = newdata.filter((data) => {
        return new Date(data.날짜) >= new Date(startday) && new Date(data.날짜) <= new Date(lastday) && data.결석여부 == false;
      });
    } else {
      newdata = newdata.filter((data) => {
        return new Date(data.날짜) >= new Date(startday) && new Date(data.날짜) <= new Date(lastday);
      });
    }

    newdata.sort(function (a, b) {
      return +(new Date(a.날짜) > new Date(b.날짜)) - 0.5;
    });

    const sum = newdata.reduce((total, current) => total + current["실제학습"], 0);
    setaver(parseInt((sum / newdata.length) * 10) / 10);
    setdata(newdata);
  }, [startday, lastday, include]);
  return (
    <div>
      <Card className="dateselctbox">
        <Form.Control
          type="date"
          value={startday}
          onChange={(e) => {
            setstartday(e.target.value);
          }}
        />
        <Form.Control
          type="date"
          value={lastday}
          onChange={(e) => {
            setlastday(e.target.value);
          }}
        />
        <Form.Check
          type="checkbox"
          label="미등원 포함"
          checked={include}
          onChange={(e) => {
            setinclude(!include);
          }}
        />
      </Card>
      <div className="graph-box">
        <LineChart className="graph" width={1000} height={500} data={data}>
          <Line type="monotone" dataKey="실제학습" stroke="#8884d8" />
          <CartesianGrid strokeDasharray="3 3" />
          <Tooltip />
          <XAxis dataKey="날짜" />
          <YAxis />
          <ReferenceLine y={aver} label={`Average : ${aver}`} stroke="green" strokeDasharray="3 3" />
        </LineChart>
      </div>
    </div>
  );
}

export default StudyChart;
