import React from "react";
import { withRouter } from "react-router-dom";
import loginImg from "../../logoUgram.png";
import Credenciales from "../Credenciales";
import Swal from "sweetalert2";

class Login extends React.Component {
  constructor(props) {
    super(props);
  }

  metodoValidarUsuario() {
    //variables recolectadas
    var usuario = document.getElementById("txtuser").value;
    var contrasena = document.getElementById("txtpassword").value;
    //falta hacer una validacion si el texto esta vacio*************
    //la Api se debe llamar /api/Login
    //retorna
    var url = "http://" + Credenciales.host + ":3030/api/Login/";
    //alert(usuario);
    //envio user:string pass:string
    var data = { user: usuario, pass: contrasena };
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
        // alert(response.autorizacion);
        // alert(response.usuario);

        if (response.autorizacion !== false) {
          Credenciales.Nombre = response.nombre;
          Credenciales.User = response.usuario;
          Credenciales.Autorizacion = response.autorizacion;
          Credenciales.Imagen = response.imagen;
          Credenciales.Perfil = response.imagen;
          Credenciales.Contrasena = response.contrasena;
          this.metodoEntrar();
        } else {
          Swal.fire({
            title: "Error!",
            text: "Datos Incorrectos",
            icon: "error",
          });
        }
      });
  }

  //---------------------------
  metodoEntrar() {
    Credenciales.login(() => {
      if (Credenciales.Perfil == "") {
        Credenciales.Perfil = Credenciales.ImagenPerfilDefault;
      }
      this.props.history.push("/Inicio");
    });
    //this.props.history.push("/navegacion");
    //window.location.href = "/navegacion";
  }

  render() {
    return (
      <div className="base-container" ref={this.props.containerRef}>
        <div className="content">
          <div className="header">Login</div>
          <div className="image">
            <img src={loginImg} />
          </div>
          <div className="form">
            <div className="form-group">
              <label htmlFor="username">User Name</label>
              <input
                type="text"
                id="txtuser"
                name="username"
                placeholder="username"
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="txtpassword"
                name="password"
                placeholder="password"
              />
            </div>
          </div>
        </div>
        <div className="footer">
          <button
            type="button"
            className="btn"
            onClick={this.metodoValidarUsuario.bind(this)}
          >
            Entrar
          </button>
        </div>
      </div>
    );
  }
}

export default withRouter(Login);
