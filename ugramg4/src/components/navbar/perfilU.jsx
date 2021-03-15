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
    return (
      <div style={{ minWidth: "100%" }}>
        <Navbar props={this.props} tituloP={Credenciales.User} />
        <FullPerfil props={this.props} />
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
  input: {
    display: "none",
  },
}));

export default function FullPerfil({ props }) {
  const classes = useStyles();
  const [editarTxt, setEditarTxt] = useState(false); //variable para desbloquear los input
  const [fperfil, setFperfil] = useState(Credenciales.Perfil); //variable para desbloquear los input
  const [tempguardar, setGuardar] = useState(false);

  const EditarDatos = () => {
    //alternar enable/disabled
    setEditarTxt(!editarTxt);
  };

  const GuardarDatos = () => {
    //alternar enable/disabled
    setEditarTxt(!editarTxt);
    var usuariocambio = document.getElementById("txtusuario").value;
    var nombrecambio = document.getElementById("txtnombre").value;
    var contrasenaverificacion = document.getElementById("txtpassword").value;

    var url = "http://" + Credenciales.host + ":3030/api/Modificar/";
    var foto = false;

    if (tempguardar) {
      foto = Credenciales.Perfil;
    }
    var MD5 = require("MD5");
    var contrasenacifrada = MD5(contrasenaverificacion);
    if (Credenciales.Contrasena === contrasenacifrada) {
      var data = {
        useractual: Credenciales.User,
        usercambio: usuariocambio,
        name: nombrecambio,
        imagen: foto,
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
          //Response trae {autorizacion:boolean,usuario:string, nombre:string,apellido:string,imagen:string}
          //La autorizacion es si la contraseña es correcta retorno un true
          //si la contraseña es incorrecta retorna false y no hace ningun cambio

          if (response.autorizacion !== false) {
            //actualiza las credenciales
            Credenciales.Nombre = response.nombre;
            Credenciales.User = response.usuario;
            Credenciales.Autorizacion = response.autorizacion;
            if (response.imagen !== false) {
              Credenciales.Imagen = response.imagen;
              Credenciales.Perfil = response.imagen;
              setFperfil(Credenciales.Perfil);
            }
            Swal.fire({
              title: "Perfil",
              text: "Informacion Modificada",
              icon: "success",
            });
          } else {
            Swal.fire({
              title: "Error!",
              text: "El usuario ya existe:(",
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
      Credenciales.Perfil = Credenciales.Imagen;
      document.getElementById("txtusuario").value = Credenciales.User;
      document.getElementById("txtnombre").value = Credenciales.Nombre;
      document.getElementById("txtpassword").value = "";
    }
  };

  const CargarFoto = (e) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.readyState === 2) {
        setFperfil(reader.result);
        Credenciales.Imagen = Credenciales.Perfil;
        Credenciales.Perfil = reader.result;

        setGuardar(true);
      }
    };
    reader.readAsDataURL(e.target.files[0]);
  };

  return (
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
            <img src={fperfil} className={classes.photo} />
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
              defaultValue={Credenciales.User}
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
              defaultValue={Credenciales.Nombre}
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
              defaultValue=""
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
              <Button variant="contained" color="primary" onClick={EditarDatos}>
                {!editarTxt ? "Editar" : "Cancelar"}
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </div>
  );
}
