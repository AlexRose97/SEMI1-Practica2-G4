import React from "react";
import { withRouter } from "react-router-dom";
import loginImg from "../../logoUgram.png";
import Credenciales from "../Credenciales";
import Swal from "sweetalert2";

class Login extends React.Component {
  /* constructor(props) {
    super(props);
  }
  */

  metodoValidarUsuario() {
    //variables recolectadas
    var usuario = document.getElementById("txtuser").value;
    var contrasena = document.getElementById("txtpassword").value;
    //falta hacer una validacion si el texto esta vacio*************
    //la Api se debe llamar /api/Login
    //retorna
    var url = "http://" + Credenciales.host + ":3030/api/LoginDatos/";
    //alert(usuario);
    //envio user:string pass:string
    var data = { username: usuario, password: contrasena };
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
          Credenciales.login(() => {
            Credenciales.Perfil = response.user.urlfoto;
            Credenciales.User = response.user.username;
            Credenciales.Nombre = response.user.name;
            Credenciales.Contrasena = response.user.password;
            this.props.history.push("/Inicio");
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
  render() {
    return (
      <div className="base-container" ref={this.props.containerRef}>
        <div className="content">
          <div className="header">Login</div>
          <div className="image">
            <img src={loginImg} alt="" />
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
        <div>
          <div style={{ padding: 5 }}>
            <button
              type="button"
              className="btn"
              onClick={this.metodoValidarUsuario.bind(this)}
            >
              Entrar
            </button>
          </div>
          <div>
            <button type="button" className="btn">
              Reconocimiento Facial
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default withRouter(Login);
