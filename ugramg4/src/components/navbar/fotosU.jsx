import React, { useState } from "react";
import Navbar from "./Navbar";
import { makeStyles } from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";
import CloudUploadIcon from "@material-ui/icons/CloudUpload";
import Credenciales from "../Credenciales";
import SaveIcon from "@material-ui/icons/Save";
import Swal from "sweetalert2";

import { Button, TextField } from "@material-ui/core";

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
  const [fotocargada, setfotocargada] = React.useState(false);
  const [newdescripcion, setnewdescripcion] = React.useState("");
  const [newname, setnewname] = React.useState("");

  //cargar en variables el texto ingresado
  const inputChange = (e) => {
    let { id, value } = e.target;
    if (id === "txtdescripcion") {
      setnewdescripcion(value);
    } else if (id === "txtnombreimagen") {
      setnewname(value);
    }
  };

  //volver a los estados iniciales
  const cancelarT = () => {
    setFCargada(Credenciales.ImagenPerfilDefault); //variable para desbloquear los input
    setfotocargada(false);
    setnewdescripcion("");
    setnewname("");
  };
  //---------------------------
  const CargarFoto = (e) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.readyState === 2) {
        setFCargada(reader.result);
        setfotocargada(true);
      }
    };
    reader.readAsDataURL(e.target.files[0]);
  };

  const guardarFoto = () => {
    var url = "http://" + Credenciales.host + ":3030/api/InsertarImagen/";
    if (fotocargada) {
      if (newdescripcion !== "" && newname !== "") {
        var data = {
          descripcion: newdescripcion,
          nombre: newname,
          foto: fCargada,
          idiclient: Credenciales.Iduser,
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
                text: response.msg,
                icon: "success",
              });
              const x = cancelarT();
            } else {
              Swal.fire({
                title: "Error!",
                text: response.msg,
                icon: "error",
              });
            }
          });
      } else {
        Swal.fire({
          title: "Error!",
          text: "El nombre y la descripcion son obligatorios",
          icon: "error",
        });
      }
    } else {
      Swal.fire({
        title: "Error!",
        text: "Debes Cargar una Foto",
        icon: "error",
      });
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
                id="txtdescripcion"
                label="Descripcion"
                onChange={inputChange}
                value={newdescripcion}
                multiline
                rows={10}
                variant="outlined"
              />
            </Grid>
            <Grid item>
              <TextField
                id="txtnombreimagen"
                label="Nombre de la Foto"
                onChange={inputChange}
                value={newname}
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
              <Button variant="contained" onClick={cancelarT} color="secondary">
                Cancelar
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </div>
  );
}
