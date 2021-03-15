import React, { useState } from "react";
import Navbar from "./Navbar";
import { makeStyles } from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";
import { Button, TextField } from "@material-ui/core";
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
  const [fperfil, setFperfil] = useState(Credenciales.Perfil); //variable para desbloquear los input
  const irPerfil = () => {
    props.history.push("/Perfil");
  };

  return (
    <div className={classes.root}>
      <Grid container spacing={4}>
        <Grid item xs={12}>
          <h1>Datos Personales</h1>
        </Grid>
        <Grid
          container
          direction="column"
          alignItems="flex-end"
          xs={5}
          spacing={2}
        >
          <Grid item xs>
            <TextField
              id="outlined-read-only-input"
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
              id="outlined-read-only-input"
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
        </Grid>
        <Grid
          container
          direction="column"
          alignItems="center"
          xs={7}
          spacing={2}
        >
          <Grid item xs>
            <img src={fperfil} className={classes.photo} />
          </Grid>
        </Grid>
      </Grid>
    </div>
  );
}
