import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ScrollToTop } from "./components/ScrollToTop";

import { NIP19Page } from "./pages/NIP19Page";
import NotFound from "./pages/NotFound";
import Messages from "./pages/Messages";
import { RPGInterface } from "./components/rpg/RPGInterface";
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
        <Route path="/legacy" element={<RPGInterface />} />
        <Route path="/game" element={<RPGInterface />} />
        <Route path="/messages" element={<Messages />} />
        {/* NIP-19 route for npub1, note1, naddr1, nevent1, nprofile1 */}
        <Route path="/:nip19" element={<NIP19Page />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
export default AppRouter;