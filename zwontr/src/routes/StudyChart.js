import { Form, Button, Card, ListGroup, Table, Modal, Row, Col } from "react-bootstrap";
import { useHistory, useParams } from "react-router-dom/cjs/react-router-dom.min";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import TimePicker from "react-time-picker";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from "recharts";
import "./StudyChart.scss";

function StudyChart() {
  let history = useHistory();
  const param = useParams();
  const [stuDB, setstuDB] = useState({});
  const [TRlist, setTRlist] = useState([]);
  const [data, setdata] = useState([]);

  const [startday, setstartday] = useState("");
  const [lastday, setlastday] = useState("");
  const [aver, setaver] = useState(0);
  const [include, setinclude] = useState(true);

  const isInitialMount = useRef(true);

  useEffect(async () => {
    console.log("TRlist 요청");
    const foundTRlist = await axios
      .get(`/api/TR/${param["ID"]}`)
      .then((result) => {
        if (result.data === "로그인필요") {
          window.alert("로그인이 필요합니다.");
          return history.push("/");
        }
        return result.data;
      })
      .catch(function (err) {
        console.log("/api/TR/:ID fail : ", err);
      });

    foundTRlist.sort(function (a, b) {
      return +(new Date(a.날짜) > new Date(b.날짜)) - 0.5;
    });
    setTRlist(foundTRlist);
    setdata(foundTRlist);
    setstartday(foundTRlist[0].날짜);
    setlastday(foundTRlist[foundTRlist.length - 1].날짜);
    isInitialMount.current = false;
  }, []);

  useEffect(() => {
    if (!isInitialMount.current) {
      var newdata = [...TRlist];
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
    }
  }, [startday, lastday, include]);
  return (
    <div className="studyChart-background">
      <Card className="dateselctbox chartCard">
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
      <div className="graph-box chartCard">
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
