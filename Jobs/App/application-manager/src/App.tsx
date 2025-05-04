import './App.css'
import {ThemeProvider} from "@/feature/theme-provider/ThemeProvider.tsx";
import {WorkspacePage} from "@/feature/workspace-page/WorkspacePage.tsx";
import {createBrowserRouter, createRoutesFromElements, Outlet, Route, RouterProvider} from "react-router-dom";
import * as React from "react";
import {AuthPage} from "@/feature/auth-page/AuthPage.tsx";

const Main = (): React.ReactNode => {
    return <ThemeProvider>
        <Outlet/>
    </ThemeProvider>
}
function App() {
    const router = createBrowserRouter(
        createRoutesFromElements (
      <Route path='' element={<Main/>}>
          <Route path='/auth' element={<AuthPage/>}/>
          <Route path='/workspace' element={<WorkspacePage/>}/>
      </Route>
  ), { basename: '' })

    return <RouterProvider router={router}></RouterProvider>
}

export default App
