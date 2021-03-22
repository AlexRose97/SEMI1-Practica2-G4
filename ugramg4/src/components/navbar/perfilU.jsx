import React, { useState } from "react";
import Navbar from "./Navbar";
import { makeStyles } from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";
import { Button, TextField } from "@material-ui/core";
import CloudUploadIcon from "@material-ui/icons/CloudUpload";
import SaveIcon from "@material-ui/icons/Save";
import Credenciales from "../Credenciales";
import Swal from "sweetalert2";

export class PerfilU extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return <FullPerfil props={this.props} />;
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
  input: {
    display: "none",
  },
}));

export default function FullPerfil({ props }) {
  const classes = useStyles();
  const [editarTxt, setEditarTxt] = useState(false); //variable para desbloquear los input
  const [tempguardar, setGuardar] = useState(false);
  const [newfoto, setnewfoto] = useState(Credenciales.Perfil); //variable para desbloquear los input
  const [newuser, setnewuser] = useState(Credenciales.User); //variable para desbloquear los input
  const [newname, setnewname] = useState(Credenciales.Nombre); //variable para desbloquear los input
  const [confpass, setconfpass] = useState(""); //variable para desbloquear los input

  const EditarDatos = () => {
    setEditarTxt(true);
  };

  //cargar en variables el texto ingresado
  const inputChange = (e) => {
    let { id, value } = e.target;
    if (id === "txtusuario") {
      setnewuser(value);
    } else if (id === "txtnombre") {
      setnewname(value);
    } else if (id === "txtpassword") {
      setconfpass(value);
    }
  };

  //volver a los estados iniciales
  const cancelarT = () => {
    setEditarTxt(false);
    setnewfoto(Credenciales.Perfil);
    setnewuser(Credenciales.User); //variable para desbloquear los input
    setnewname(Credenciales.Nombre); //variable para desbloquear los input
    setconfpass(""); //variable para desbloquear los input
    setGuardar(false);
  };

  const GuardarDatos = () => {
    var url = "http://" + Credenciales.host + ":3030/api/Modificar/";
    var MD5 = require("MD5");
    var contrasenacifrada = MD5(confpass);
    var foto = newfoto;
    if (tempguardar !== true) {
      foto = false;
    }
    if (Credenciales.Contrasena === contrasenacifrada) {
      var data = {
        newuser: newuser,
        user: Credenciales.User,
        name: newname,
        foto: foto,
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
              title: "Exito!",
              text: response.msg,
              icon: "success",
            });
            Credenciales.Perfil = response.user.urlfoto;
            Credenciales.User = response.user.username;
            Credenciales.Nombre = response.user.name;
            Credenciales.Contrasena = response.user.password;
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
        text: "Contraseña invalida",
        icon: "error",
      });
    }
  };

  const CargarFoto = (e) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.readyState === 2) {
        setnewfoto(reader.result);
        setGuardar(true);
      }
    };
    reader.readAsDataURL(e.target.files[0]);
  };

  return (
    <div style={{ width: "100%" }}>
      <div>
        <Navbar
          props={props}
          tituloP={Credenciales.User}
          foto={Credenciales.Perfil}
        />
      </div>
      <div className={classes.root}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <h1>Datos Personales</h1>
          </Grid>
          <Grid
            container
            direction="column"
            alignItems="center"
            xs={7}
            spacing={4}
          >
            <Grid item xs>
              <img src={newfoto} className={classes.photo} alt={""}/>
            </Grid>
            <Grid item xs>
              <input
                disabled={!editarTxt}
                accept="image/*"
                className={classes.input}
                id="contained-button-file"
                multiple
                type="file"
                onChange={CargarFoto}
              />
              <label htmlFor="contained-button-file">
                <Button
                  disabled={!editarTxt}
                  variant="contained"
                  color="primary"
                  component="span"
                  startIcon={<CloudUploadIcon />}
                >
                  Nueva Foto
                </Button>
              </label>
            </Grid>
          </Grid>
          <Grid
            container
            direction="column"
            alignItems="flex-start"
            xs={5}
            spacing={2}
          >
            <Grid item xs>
              <TextField
                id="txtusuario"
                label="Usuario"
                onChange={inputChange}
                value={newuser}
                InputProps={{
                  readOnly: !editarTxt,
                }}
                variant="outlined"
              />
            </Grid>
            <Grid item xs>
              <TextField
                id="txtnombre"
                label="Nombre Completo"
                onChange={inputChange}
                value={newname}
                InputProps={{
                  readOnly: !editarTxt,
                }}
                variant="outlined"
              />
            </Grid>
            <Grid item xs>
              <TextField
                id="txtpassword"
                label="Confirmar Contraseña"
                type="password"
                onChange={inputChange}
                value={confpass}
                InputProps={{
                  readOnly: !editarTxt,
                }}
                variant="outlined"
              />
            </Grid>
            <Grid container direction="row" justify="flex-start" xs spacing={4}>
              <Grid item>
                <Button
                  disabled={!editarTxt}
                  variant="contained"
                  color="primary"
                  onClick={GuardarDatos}
                  startIcon={<SaveIcon />}
                >
                  Guardar
                </Button>
              </Grid>
              <Grid item>
                {!editarTxt ? (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={EditarDatos}
                  >
                    Editar
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={cancelarT}
                  >
                    Cancelar
                  </Button>
                )}
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </div>
    </div>
  );
}
