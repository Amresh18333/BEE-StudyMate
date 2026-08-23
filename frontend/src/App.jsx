import {
    BrowserRouter,
    Routes,
    Route
} from "react-router-dom";

import Layout from "./components/common/Layout";

import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import Subjects from "./pages/Subjects";
import SubjectDetails from "./pages/SubjectDetails";
import TopicStudy from "./pages/TopicStudy";
import "./App.css";
import Profile from "./pages/Profile";


function App() {
    return (
        <BrowserRouter>

            <Routes>

                <Route path="/" element={<Home />} />

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
                        path="/profile"
                        element={<Profile />}
                    />
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