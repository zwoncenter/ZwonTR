const request_type_name_to_index={
    "lifeData":0,
    "AssignmentStudyData":1,
    "LectureAndTextbookStudyData":2,
    "ProgramParticipationData":3,
}
const request_document_template={
    student_id:null,
    date:null,
    request_status:0,
    request_type:null,
    request_specific_data:null,
    study_data_list:null,
    review_msg_list:null,
};
const request_study_data_template={
    excuse:null,
    time_amount:null,
    timestamp:null,
};
const request_review_msg_template={
    review_msg:null,
    review_from:null,
    timestamp:null,
};
const daily_LAT_request_max_count=50;
function intBetween(a,left,right){
    return a>=left && a<=right;
}
function checkTimeStringValid(time_string){
    if(typeof time_string!=="string") return false;
    const string_splitted=time_string.split(":");
    if(string_splitted.length!==2) return false;
    else if(!intBetween(string_splitted[0].length,1,2) || !intBetween(string_splitted[1].length,1,2)) return false;
    else if(Number.isNaN(parseInt(string_splitted[0])) || Number.isNaN(parseInt(string_splitted[1]))) return false;
    else return true;
}
function checkConditionValueValid(condition_val){
    const parsed=parseInt(condition_val);
    if(Number.isNaN(parsed)) return false;
    else return intBetween(parsed,1,5)
}
function checkLifeDataValid(bodyCondition,sentimentCondition,goToBedTime,wakeUpTime){
    return checkConditionValueValid(bodyCondition) && checkConditionValueValid(sentimentCondition)
        && checkTimeStringValid(goToBedTime) && checkTimeStringValid(wakeUpTime);
}
function getNewLifeDataRequestDocument(student_id,today_string){
    const request_doc={...request_document_template};
    request_doc["student_id"]=student_id
    request_doc["date"]=today_string;
    request_doc["request_status"]=0;
    request_doc["request_type"]=request_type_name_to_index["lifeData"];
    request_doc["request_specific_data"]={};
    request_doc["study_data_list"]=[];
    request_doc["review_msg_list"]=[];
    return request_doc;
}
function checkExcuseValueValid(excuse_val,finishedState){
    return (typeof excuse_val === "string") && ((finishedState===true && excuse_val.length===0) || (finishedState===false && intBetween(excuse_val.length,15,200)));
}
function checkRequestDataUpdatable(request_status){
    return request_status===0 || request_status===2;
}
function getNewAssignmentStudyDataRequestDocument(student_id,today_string,AOSID){
    const request_doc={...request_document_template};
    request_doc["student_id"]=student_id
    request_doc["date"]=today_string;
    request_doc["request_status"]=0;
    request_doc["request_type"]=request_type_name_to_index["AssignmentStudyData"];
    request_doc["request_specific_data"]={AOSID};
    request_doc["review_msg_list"]=[];
    delete request_doc["study_data_list"];
    return request_doc;
}
function getNewTextbookStudyDataRequestDocument(student_id,today_string,textbookID,elementID){
    const request_doc={...request_document_template};
    request_doc["student_id"]=student_id;
    request_doc["date"]=today_string;
    request_doc["request_status"]=0;
    request_doc["request_type"]=request_type_name_to_index["LectureAndTextbookStudyData"];
    request_doc["request_specific_data"]={textbookID,elementID,deleted:false,duplicatable:textbookID?false:true};
    request_doc["review_msg_list"]=[];
    delete request_doc["study_data_list"];
    return request_doc;
}
module.exports={
    request_document_template,
    request_study_data_template,
    request_review_msg_template,
    request_type_name_to_index,
    daily_LAT_request_max_count,
    intBetween,
    checkTimeStringValid,
    checkConditionValueValid,
    checkLifeDataValid,
    getNewLifeDataRequestDocument,
    checkExcuseValueValid,
    getNewAssignmentStudyDataRequestDocument,
    getNewTextbookStudyDataRequestDocument,
    checkRequestDataUpdatable,
}