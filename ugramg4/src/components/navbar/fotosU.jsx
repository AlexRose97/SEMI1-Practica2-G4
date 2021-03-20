import React, { useState } from "react";
import Navbar from "./Navbar";
import { makeStyles } from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";
import CloudUploadIcon from "@material-ui/icons/CloudUpload";
import Credenciales from "../Credenciales";
import SaveIcon from "@material-ui/icons/Save";

import {
  Button,
  FormControl,
  FormHelperText,
  InputLabel,
  Select,
  TextField,
} from "@material-ui/core";

export class FotosU extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <div style={{ minWidth: "100%" }}>
        <Navbar
          props={this.props}
          tituloP={"Fotos"}
          foto={Credenciales.Perfil}
        />
        <FullFotos props={this.props} />
      </div>
    );
  }
}

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    padding: theme.spacing(2),
  },
  gridList: {
    width: "70%",
    height: "200px",
  },
  containerList: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
  },
  formControl: {
    margin: theme.spacing(1),
    minWidth: 120,
  },
  photo: {
    maxWidth: 400,
    maxHeight: 400,
    borderRadius: "20%",
  },
  potho2: {
    maxWidth: 200,
    maxHeight: 200,
  },
  input: {
    display: "none",
  },
}));

export default function FullFotos({ props }) {
  const classes = useStyles();
  const [fCargada, setFCargada] = useState(Credenciales.ImagenPerfilDefault); //variable para desbloquear los input
  const [consulta, setconsulta] = React.useState("");
  const [albumElimi, setalbumElimi] = React.useState("");
  const [refreshp, setrefreshp] = React.useState(0);
  const [fotocargada, setfotocargada] = React.useState(false);

  //---------------------------
  const CargarFoto = (e) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.readyState === 2) {
        setFCargada(reader.result);
        setfotocargada(true);
        //Credenciales.Perfil = reader.result;
      }
    };
    reader.readAsDataURL(e.target.files[0]);
  };

  //--------------------Eliminar
  const guardarFoto = () => {
    var NombreImagen = document.getElementById("txtnombreimagen").value;
    if (NombreImagen != "") {
      if (fotocargada) {
        if (albumElimi != "") {
          var data = {
            idalbum: albumElimi,
            name: NombreImagen,
            imagen: fCargada,
          };
          fetch("http://" + Credenciales.host + ":3030/api/InsertarImagen/", {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          })
            .then((response) => response.json())
            .then((json2) => {
              return json2;
            })
            .then((json2) => {
              //aca la rspuesta
              alert(json2);
              setalbumElimi("");
            })
            .catch((error) => {
              console.error(error);
            });

          setFCargada(Credenciales.ImagenPerfilDefault);
          document.getElementById("txtnombreimagen").value =
            "Foto" + Math.floor(Math.random() * 1000);
          // props.history.push("/Fotos");
        } else {
          alert("Selecciona un album a agregar");
        }
        setrefreshp(refreshp + 1);
      } else {
        alert("Debe Cargar Una Foto");
      }
    } else {
      alert("Debe colocarle un nombre a la imagen");
    }
  };

  return (
    <div className={classes.root}>
      <Grid container alignItems="flex-start" spacing={4}>
        <Grid item xs>
          <Grid container direction="column" alignItems="center" spacing={4}>
            <Grid item>
              <img src={fCargada} className={classes.photo} />
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
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs>
          <Grid container direction="column" alignItems="baseline" spacing={4}>
            <Grid item>
              <TextField
                id="outlined-multiline-static"
                label="Descripcion"
                multiline
                rows={10}
                variant="outlined"
              />
            </Grid>
            <Grid item>
              <TextField
                id="txtnombreimagen"
                label="Nombre de la Foto"
                defaultValue={"Foto" + Math.floor(Math.random() * 1000)}
                InputProps={{
                  readOnly: false,
                }}
                variant="outlined"
              />
            </Grid>
            <Grid item>
              <Button
                variant="contained"
                onClick={guardarFoto}
                color="primary"
                startIcon={<SaveIcon />}
              >
                Guardar Foto
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </div>
  );
}
