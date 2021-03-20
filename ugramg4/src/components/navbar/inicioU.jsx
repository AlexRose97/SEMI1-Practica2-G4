import React, { useState } from "react";
import Navbar from "./Navbar";
import { makeStyles } from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";
import { Button, TextField } from "@material-ui/core";
import Chip from "@material-ui/core/Chip";
import Credenciales from "../Credenciales";

export class InicioU extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <div style={{ minWidth: "100%" }}>
        <Navbar props={this.props} tituloP={"Inicio"} />
        <FullInicio props={this.props} />
      </div>
    );
  }
}

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    padding: theme.spacing(2),
  },
  paper: {
    padding: theme.spacing(2),
  },
  photo: {
    maxWidth: 300,
    maxHeight: 300,
    borderRadius: "50%",
  },
}));

export default function FullInicio({ props }) {
  const classes = useStyles();
  const [fperfil, setFperfil] = useState(Credenciales.Perfil);
  const [consulta, setconsulta] = React.useState("");
  const irPerfil = () => {
    props.history.push("/Perfil");
  };

  var data = { foto: fperfil };
  React.useEffect(() => {
    fetch("http://" + Credenciales.host + ":3030/api/EtiquetasPerfil/", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((response) => response.json())
      .then((json) => {
        return json;
      })
      .then((json) => {
        console.log(json);
        setconsulta(json);
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  const etiquetas = () => {
    const listEtiquetas = [];
    for (let index = 0; index < consulta.length; index++) {
      const element = consulta[index];
      listEtiquetas.push(
        <Chip key={index} label={consulta[index].etiqueta} color="secondary" />
      );
    }

    return listEtiquetas;
  };

  return (
    <div className={classes.root}>
      <Grid container spacing={4} alignItems="center">
        <Grid item xs={12}>
          <h1>Datos Personales</h1>
        </Grid>
        <Grid container direction="column" xs spacing={2}>
          <Grid item xs>
            <TextField
              label="Usuario"
              defaultValue={Credenciales.User}
              InputProps={{
                readOnly: true,
              }}
              variant="outlined"
            />
          </Grid>
          <Grid item xs>
            <TextField
              label="Nombre Completo"
              defaultValue={Credenciales.Nombre}
              InputProps={{
                readOnly: true,
              }}
              variant="outlined"
            />
          </Grid>
          <Grid item xs>
            <Button variant="contained" color="primary" onClick={irPerfil}>
              Editar Datos
            </Button>
          </Grid>
          <Grid item xs style={{ padding: 20 }}>
            <Button variant="contained" color="primary">
              Escanear texto de una imagen
            </Button>
          </Grid>
        </Grid>
        <Grid container direction="column" xs spacing={2}>
          <Grid item xs>
            <div style={{ flexDirection: "row", display: "flex" }}>
              <img src={fperfil} className={classes.photo} />
              <div style={{ width: 150 }}>{etiquetas()}</div>
            </div>
          </Grid>
        </Grid>
      </Grid>
    </div>
  );
}
