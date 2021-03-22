import React, { useState } from "react";
import Navbar from "./Navbar";
import { makeStyles } from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";
import { Button, TextField } from "@material-ui/core";
import Chip from "@material-ui/core/Chip";
import Credenciales from "../Credenciales";
import CloudUploadIcon from "@material-ui/icons/CloudUpload";
import Swal from "sweetalert2";

export class InicioU extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <div style={{ minWidth: "100%" }}>
        <Navbar
          props={this.props}
          tituloP={"Inicio"}
          foto={Credenciales.Perfil}
        />
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
    //borderRadius: "50%",
  },
  formControl: {
    margin: theme.spacing(1),
    minWidth: 120,
  },
  input: {
    display: "none",
  },
}));

export default function FullInicio({ props }) {
  const classes = useStyles();
  const [fperfil, setFperfil] = useState(Credenciales.Perfil);
  const [consulta, setconsulta] = React.useState("");
  const [newfoto, setnewfoto] = React.useState("");
  const [fcargada, setfcargada] = React.useState(false);
  const irPerfil = () => {
    props.history.push("/Perfil");
  };
  //--------------------------- cargar foto
  const CargarFoto = (e) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.readyState === 2) {
        setnewfoto(reader.result);
        setfcargada(true);
      }
    };
    reader.readAsDataURL(e.target.files[0]);
  };
  //analizar texto
  const extraerTexto = () => {
    var url = "http://" + Credenciales.host + ":3030/api/DetectarTexto/";
    if (fcargada) {
      var data = {
        foto: newfoto,
      };
      fetch(url, {
        method: "POST", // or 'PUT'
        body: JSON.stringify(data), // data can be `string` or {object}!
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((res) => res.json())
        .catch(function (error) {
          alert(error);
        })
        .then((response) => {
          if (response.status === 200) {
            Swal.fire({
              title: "Exito",
              text: response.texto,
              icon: "success",
            });
          } else {
            Swal.fire({
              title: "Error!",
              text: response.msg,
              icon: "error",
            });
          }
        });
    }
    setfcargada(false);
  };

  //--------------etiquetas perfil
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
        //console.log(json);
        setconsulta(json);
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  const etiquetas = () => {
    const listEtiquetas = [];
    for (let index = 0; index < consulta.length; index++) {
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
        <Grid item xs={6}>
          <Grid container direction="column" spacing={2}>
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
          </Grid>
        </Grid>
        <Grid item xs={6}>
          <Grid container direction="column" spacing={2}>
            <Grid item xs>
              <div style={{ flexDirection: "row", display: "flex" }}>
                <img src={fperfil} className={classes.photo} alt={""} />
                <div style={{ width: 150 }}>{etiquetas()}</div>
              </div>
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={12}>
          <h1>Analizar Texto De Una Imagen</h1>
        </Grid>
        <Grid item xs={12}>
          <Grid container direction="column" alignItems="center" spacing={4}>
            <Grid item>
              <img src={newfoto} className={classes.photo} alt={""} />
            </Grid>
            <Grid item>
              <input
                accept="image/*"
                className={classes.input}
                id="contained-button-file"
                multiple
                type="file"
                onChange={CargarFoto}
              />
              <label htmlFor="contained-button-file">
                <Button
                  variant="contained"
                  color="primary"
                  component="span"
                  startIcon={<CloudUploadIcon />}
                >
                  Cargar Foto
                </Button>
              </label>
              <Button
                variant="contained"
                color="primary"
                onClick={extraerTexto}
                disabled={!fcargada}
              >
                Escanear
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </div>
  );
}
