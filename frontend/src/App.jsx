import {
    BrowserRouter,
    Routes,
    Route
} from "react-router-dom";

import Layout from "./components/common/Layout";
import ProtectedRoute from "./components/common/ProtectedRoute";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import Subjects from "./pages/Subjects";
import SubjectDetails from "./pages/SubjectDetails";
import TopicStudy from "./pages/TopicStudy";
import "./App.css";
import Profile from "./pages/Profile";
import StudyActivity from "./pages/StudyActivity";
import QuizList from "./pages/QuizList";
import QuizTake from "./pages/QuizTake";
import QuizResult from "./pages/QuizResult";
import QuizHistory from "./pages/QuizHistory";
import AITutor from "./pages/AITutor";
import AskAI from "./pages/AskAI";
import Summarizer from "./pages/Summarizer";
import StudyPlanner from "./pages/StudyPlanner";
import QuizGenerator from "./pages/QuizGenerator";
import Resources from "./pages/Resources";

function App() {
    return (
        <BrowserRouter>

            <Routes>

                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />

                <Route element={<ProtectedRoute />}>
                <Route element={<Layout />}>

                    <Route
                        path="/dashboard"
                        element={<Dashboard />}
                    />
                    <Route
                        path="/subjects"
                        element={<Subjects />}
                    />
                    <Route
                        path="/subjects/:subjectId"
                        element={<SubjectDetails />}
                    />
                    <Route
                        path="/subjects/:subjectId/topics/:topicId/study"
                        element={<TopicStudy />}
                    />
                    <Route
                        path="/subjects/:subjectId/topics/:topicId/quiz"
                        element={<QuizList />}
                    />
                    <Route
                        path="/subjects/:subjectId/topics/:topicId/tutor"
                        element={<AITutor />}
                    />
                    <Route
                        path="/ask-ai"
                        element={<AskAI />}
                    />
                    <Route
                        path="/summarizer"
                        element={<Summarizer />}
                    />
                    <Route
                        path="/study-planner"
                        element={<StudyPlanner />}
                    />
                    <Route
                        path="/quiz/generate"
                        element={<QuizGenerator />}
                    />
                    <Route
                        path="/resources"
                        element={<Resources />}
                    />
                    <Route
                        path="/quiz/:quizId/take"
                        element={<QuizTake />}
                    />
                    <Route
                        path="/quiz/:quizId/result/:attemptId"
                        element={<QuizResult />}
                    />
                    <Route
                        path="/quiz/history"
                        element={<QuizHistory />}
                    />
                    <Route
                        path="/activity"
                        element={<StudyActivity />}
                    />
                    <Route
                        path="/profile"
                        element={<Profile />}
                    />
                </Route>
                </Route>

                <Route
                    path="*"
                    element={<NotFound />}
                />

            </Routes>

        </BrowserRouter>
    );
}


export default App;