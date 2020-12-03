import React from "react";
import "./JoinQuiz.css";
import Appbar from "../components/Appbar";

const JoinQuiz = ({ user }) => {
  return (
    <div id="join-quiz">
      <div className="appheader">
        <Appbar user={user} />
      </div>
      <div id="join-quiz-div">
        <div id="logo-name">
          <b style={{ fontweight: 600 }}>Quiz</b>dom
        </div>
        <input id = "q-code"type="text" placeholder="Enter Quiz Code" />
        <button className="join-button">Join Quiz</button>
      </div>
    </div>
  );
};

export default JoinQuiz;
