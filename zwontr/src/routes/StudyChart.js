import { Form, Button, Card, ListGroup, Table, Modal, Row, Col } from "react-bootstrap";
import { useHistory, useParams } from "react-router-dom/cjs/react-router-dom.min";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import TimePicker from "react-time-picker";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from "recharts";
import "./StudyChart.scss";
import menuarrow from "../next.png";

function StudyChart() {
  let history = useHistory();
  const param = useParams();
  const [stuDB, setstuDB] = useState({});
  const [TRlist, setTRlist] = useState([]);
  const [data, setdata] = useState([]);

  const [startday, setstartday] = useState("");
  const [lastday, setlastday] = useState("");
  const [aver, setaver] = useState(0);
  const [include_abscent, setinclude_abscent] = useState(true);
  const [include_sunday, setinclude_sunday] = useState(true);

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
      newdata = newdata.filter((data) => {
        return new Date(data.날짜) >= new Date(startday) && new Date(data.날짜) <= new Date(lastday);
      });

      if (!include_abscent) {
        newdata = newdata.filter((data) => {
          return (
            new Date(data.날짜) >= new Date(startday) &&
            new Date(data.날짜) <= new Date(lastday) &&
            data.결석여부 == false
          );
        });
      }

      if (!include_sunday) {
        newdata = newdata.filter((data) => {
          return (
            new Date(data.날짜) >= new Date(startday) &&
            new Date(data.날짜) <= new Date(lastday) &&
            data.요일 !== "일요일"
          );
        });
      }

      newdata.sort(function (a, b) {
        return +(new Date(a.날짜) > new Date(b.날짜)) - 0.5;
      });

      const sum = newdata.reduce((total, current) => total + current["실제학습"], 0);
      setaver(parseInt((sum / newdata.length) * 10) / 10);
      setdata(newdata);
    }
  }, [startday, lastday, include_abscent, include_sunday]);

  return (
    <div>
      <div className="menu">
        <div className="menu-map">
          <Button
            className="menu-map-btn btn-secondary"
            onClick={() => {
              history.push("/studentList");
            }}
          >
            <h5>
              <strong>학생 관리</strong>
            </h5>
          </Button>
          <Button
            className="menu-map-btn btn-secondary"
            onClick={() => {
              history.push("/Closemeeting/Write");
            }}
          >
            <h5>
              <strong>마감 회의</strong>
            </h5>
          </Button>
          <Button
            className="menu-map-btn btn-secondary"
            onClick={() => {
              window.alert("준비중입니다!");
            }}
          >
            <h5>
              <strong>매니저 업무리스트</strong>
            </h5>
          </Button>
          <Button
            className="menu-map-btn btn-secondary"
            onClick={() => {
              window.alert("준비중입니다!");
            }}
          >
            <h5>
              <strong>대시보드</strong>
            </h5>
          </Button>
        </div>
        <div className="menuArrow">
          <img src={menuarrow} alt="menuarrow" />
        </div>
      </div>
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
          checked={include_abscent}
          onChange={(e) => {
            setinclude_abscent(!include_abscent);
          }}
        />
        <Form.Check
          type="checkbox"
          label="일요일 포함"
          checked={include_sunday}
          onChange={(e) => {
            setinclude_sunday(!include_sunday);
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
