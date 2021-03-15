import React from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import "./App.scss";
import { Inicio } from "./components/login/inicio";
import { InicioU } from "./components/navbar/inicioU";
import { PerfilU } from "./components/navbar/perfilU";
import { Err404 } from "./components/Err404";
import { ProtecPage } from "./components/ProtecPage";
import { AlbumesU } from "./components/navbar/albumesU";
import { FotosU } from "./components/navbar/fotosU";

class App extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <Router>
        <div className="App">
          <Switch>
            <Route path="/" exact component={Inicio} />
            <ProtecPage exact path="/Inicio" component={InicioU} />
            <ProtecPage exact path="/Perfil" component={PerfilU} />
            <ProtecPage exact path="/Albumes" component={AlbumesU} />
            <ProtecPage exact path="/Fotos" component={FotosU} />
            <Route component={Err404} />
          </Switch>
        </div>
      </Router>
    );
  }
}

/*
<Route exact path="/">
    <Redirect to="/home" />
</Route>
*/
export default App;
