import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ScrollToTop } from "./components/ScrollToTop";
import NotFound from "./pages/NotFound";
import TitleScreen from "./components/TitleScreen";
import GameContainer from "./components/GameContainer";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export function AppRouter() {
  const { user } = useCurrentUser();

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<TitleScreen />} />
        <Route path="/play/*" element={user ? <GameContainer /> : <TitleScreen />} />
        <Route path="/game" element={<Navigate to="/play" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
export default AppRouter;
