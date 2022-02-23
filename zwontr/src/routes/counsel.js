<Table striped bordered hover className="mt-3">
  <thead>
    <tr>
      <th width="15%">매니저</th>
      <th width="20%">소요시간</th>
      <th width="55%">상세내용</th>
      <th width="10%"></th>
    </tr>
  </thead>
  <tbody>
    {TR.상담.map(function (a, i) {
      return (
        <tr key={i}>
          <td>
            <Form.Select
              size="sm"
              onChange={(e) => {
                var newTR = JSON.parse(JSON.stringify(TR));
                newTR.상담[i].매니저 = e.target.value;
                TR변경(newTR);
              }}
            >
              <option>선택</option>
              {["전성원", "탁현창", "강민호", "임세린", "김시우", "최연우", "김윤태", "장명수", "강나무", "양재원", "방진영", "오지영", "유장훈", "오지영"].map(
                function (b, j) {
                  return (
                    <option value={b} key={j}>
                      {b}
                    </option>
                  );
                }
              )}
            </Form.Select>
          </td>
          <td>
            <input
              type="text"
              placeholder="0:00"
              className="inputText"
              onChange={(e) => {
                var newTR = JSON.parse(JSON.stringify(TR));
                newTR.상담[i].소요시간 = e.target.value;
                let 실제시간 = 0;
                let 실제분 = 0;
                newTR.상담.map(function (c, k) {
                  if (c.소요시간) {
                    실제시간 += parseInt(c.소요시간.split(":")[0]);
                    실제분 += parseInt(c.소요시간.split(":")[1]);
                  }
                });
                newTR.상담시간 = parseFloat((실제시간 + 실제분 / 60).toFixed(1));
                TR변경(newTR);
              }}
            />
          </td>
          <td>
            <textarea
              className="textArea"
              name=""
              id=""
              rows="3"
              placeholder="상담 상세내용 입력"
              onChange={(e) => {
                var newTR = JSON.parse(JSON.stringify(TR));
                newTR.상담[i].상세내용 = e.target.value;
                TR변경(newTR);
              }}
            ></textarea>
          </td>
          <td>
            <button
              className="btn btn-delete"
              onClick={() => {
                if (i > -1) {
                  var newTR = JSON.parse(JSON.stringify(TR));
                  newTR.상담.splice(i, 1);
                  TR변경(newTR);
                }
              }}
            >
              x
            </button>
          </td>
        </tr>
      );
    })}

    <tr>
      <td colSpan={5}>총 상담 시간 : {TR.상담시간}시간</td>
    </tr>
    <tr>
      <td colSpan={5}>
        {" "}
        <button
          className="btn btn-dark"
          onClick={() => {
            var newTR = JSON.parse(JSON.stringify(TR));
            newTR.상담.push({
              매니저: "",
              소요시간: "",
              상세내용: "",
            });
            TR변경(newTR);
          }}
        >
          +
        </button>
      </td>
    </tr>
  </tbody>
</Table>;

<p className="fw-bold mt-3">상담</p>
            <Table striped bordered hover className="mt-3">
              <thead>
                <tr>
                  <th width="15%">매니저</th>
                  <th width="20%">소요시간</th>
                  <th width="55%">상세내용</th>
                  <th width="10%"></th>
                </tr>
              </thead>
              <tbody>
                {TR.상담.map(function (a, i) {
                  return (
                    <tr key={i}>
                      <td>
                        <Form.Select
                          size="sm"
                          onChange={(e) => {
                            var newTR = JSON.parse(JSON.stringify(TR));
                            newTR.상담[i].매니저 = e.target.value;
                            TR변경(newTR);
                          }}
                        >
                          <option>{a.매니저 ? a.매니저 : "선택"}</option>
                          <option value="유장훈">유장훈</option>
                          <option value="오지영">오지영</option>
                        </Form.Select>
                      </td>
                      <td>
                        <input
                          type="text"
                          placeholder="ex) 0:30"
                          defaultValue={a.소요시간}
                          className="inputText"
                          onChange={(e) => {
                            var newTR = JSON.parse(JSON.stringify(TR));
                            newTR.상담[i].소요시간 = e.target.value;
                            let 실제시간 = 0;
                            let 실제분 = 0;
                            newTR.상담.map(function (c, k) {
                              if (c.소요시간) {
                                실제시간 += parseInt(c.소요시간.split(":")[0]);
                                실제분 += parseInt(c.소요시간.split(":")[1]);
                              }
                            });
                            newTR.상담시간 = parseFloat((실제시간 + 실제분 / 60).toFixed(1));
                            TR변경(newTR);
                          }}
                        />
                      </td>
                      <td>
                        <textarea
                          className="textArea"
                          name=""
                          id=""
                          rows="3"
                          placeholder="상담 상세내용 입력"
                          defaultValue={a.상세내용}
                          onChange={(e) => {
                            var newTR = JSON.parse(JSON.stringify(TR));
                            newTR.상담[i].상세내용 = e.target.value;
                            TR변경(newTR);
                          }}
                        ></textarea>
                      </td>
                      <td>
                        <button
                          className="btn btn-delete"
                          onClick={() => {
                            if (i > -1) {
                              var newTR = JSON.parse(JSON.stringify(TR));
                              newTR.상담.splice(i, 1);
                              TR변경(newTR);
                            }
                          }}
                        >
                          x
                        </button>
                      </td>
                    </tr>
                  );
                })}

                <tr>
                  <td colSpan={5}>총 상담 시간 : {TR.상담시간}시간</td>
                </tr>
                <tr>
                  <td colSpan={5}>
                    {" "}
                    <button
                      className="btn btn-dark"
                      onClick={() => {
                        var newTR = JSON.parse(JSON.stringify(TR));
                        newTR.상담.push({
                          매니저: "",
                          소요시간: "",
                          상세내용: "",
                        });
                        TR변경(newTR);
                      }}
                    >
                      +
                    </button>
                  </td>
                </tr>
              </tbody>
            </Table>;