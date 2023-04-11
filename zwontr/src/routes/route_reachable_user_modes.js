import { matchPath } from "react-router-dom";

const path_to_permitted_user_modes_map={
    "/":["guest"],
    "/studentList":["manager","admin"],
    "/Closemeeting/:date":["manager","admin"],
    "/Middlemeeting/Write/:date":["manager","admin"],
    "/Middlemeeting/Edit/:date":["manager","admin"],
    "/Todolist":["manager","admin"],
    "/Dashboard":["manager","admin"],
    "/Textbook":["manager","admin"],
    "/Weeklymeeting/Write/:thisMonday":["manager","admin"],
    "/Weeklymeeting/Edit/:thisMonday":["manager","admin"],
    "/Lecture":["manager","admin"],
    "/Lecture/:lectureID":["manager","admin"],
    "/WeeklystudyfeedbackWrite/:ID/:feedbackDate":["manager","admin"],
    "/WeeklystudyfeedbackEdit/:ID/:feedbackDate":["manager","admin"],
    "/ManageUser":["admin"],
    "/NotFound":["guest","parent","student","manager","admin"],
};
const path_list= Object.keys(path_to_permitted_user_modes_map);
const public_path_list=new Set(["/","/NotFound"]);
function checkUserPermittedToAccessPath(cur_path,user_mode){
    if(public_path_list.has(cur_path)) return true;
    let matched_path=null;
    for(let i=0; i<path_list.length; i++){
        if(matchPath(cur_path,{path:path_list[i],exact:true})){
            matched_path=path_list[i];
            break;
        }
    }
    if(!matched_path) return true;
    const permitted_user_modes=new Set(path_to_permitted_user_modes_map[matched_path]);
    return permitted_user_modes.has(user_mode);
}
export default checkUserPermittedToAccessPath;