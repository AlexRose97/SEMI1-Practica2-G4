import { Button } from "@material-ui/core";
import React from "react";
import { withRouter } from "react-router-dom";
import Credenciales from "../Credenciales";


class Register extends React.Component {
  constructor(props) {
    super(props);
    Credenciales.Perfil=Credenciales.ImagenPerfilDefault;
    this.state = {
      fperfil:Credenciales.ImagenPerfilDefault,
    };
    
  }
  CargarFoto = (e) => {

    const reader = new FileReader();
    reader.onload = () => {
      if (reader.readyState === 2) {
        this.setState({ fperfil: reader.result });
        Credenciales.Perfil = reader.result;

      }
    };
    reader.readAsDataURL(e.target.files[0]);
  };

  MetodoRegistrarUsuario() {
    
    var usuarioregistro = document.getElementById("txtusuario").value;
    var nombreregistro = document.getElementById("txtnombre").value;
    var contrasena= document.getElementById("txtpassword").value;  
    var contrasenatwo =document.getElementById("txtpasswordconfirm").value;;

    alert(usuarioregistro + nombreregistro+contrasena+contrasenatwo);
    alert(Credenciales.Perfil);
    if(contrasena==contrasenatwo){
      var url= "http://"+Credenciales.host+":3030/api/Registro/";
      //envio user:string, name:string,pass:string,contrasena:string imagen:Imagenen64 (string) 
      var data={user:usuarioregistro,name:nombreregistro,pass:contrasena,imagen:Credenciales.Perfil}
      fetch(url, {
        method: 'POST', // or 'PUT'
        body: JSON.stringify(data), // data can be `string` or {object}!
        headers:{
          'Content-Type': 'application/json'
        }
      }).then(res => res.json())
      .catch(function(error) {
        alert(error);
      })
      .then((response)=>{
    
      //Response trae {autorizacion:boolean,usuario:string, nombre:string,apellido:string,imagen:string}
      //La autorizacion es que si el usuario que se envio no esta registrado ya , si esta registrado retorna false
      //si no esta registrado retorna true 

      alert(response.autorizacion);
      alert(response.usuario);
      
      
      if(response.autorizacion!=false){
        
        Credenciales.Nombre =response.nombre;
        Credenciales.User =response.usuario;
        Credenciales.Autorizacion=response.autorizacion;
        Credenciales.Imagen=response.imagen;
        Credenciales.Perfil=response.imagen;
        Credenciales.Contrasena=response.Contrasena;
        this.MetodoEntrar();
      }else{
        alert("Usuario Invalido");
      }
    
    });
    }else{
      alert("Contraseñas no coinciden");
    }
    //url para registro
    

    alert("Presiono Registrar");
  }

  MetodoEntrar(){
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
      <div>
        <div style={{ display: "flex" }}>
          <div className="content">Registro</div>
          <div className="content">
            <div className="form">
              <div className="form-group">
                <label htmlFor="username">User Name</label>
                <input
                  type="text"
                  id="txtusuario"
                  name="username"
                  placeholder="username"
                />
              </div>
              <div className="form-group">
                <label htmlFor="name">Name</label>
                <input
                  type="text"
                  id="txtnombre"
                  name="name"
                  placeholder="name"
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="text"
                  id="txtpassword"
                  name="password"
                  placeholder="password"
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">Confirm Password</label>
                <input
                  type="text"
                  id="txtpasswordconfirm"
                  name="password"
                  placeholder="password"
                />
              </div>
            </div>
          </div>
          <div className="content">
            <div className="image">
              <img src={this.state.fperfil}  />
            </div>
            <div className="footer">
              <input
                accept="image/*"
                id="contained-button-file"
                multiple
                type="file"
                onChange={this.CargarFoto}
                style={{ display: "none" }}
              />
              <label htmlFor="contained-button-file">
                <Button variant="contained" color="primary" component="span">
                  Cargar Foto
                </Button>
              </label>
            </div>
          </div>
        </div>
        <div className="footer">
          <Button
            variant="contained"
            color="primary"
            onClick={this.MetodoRegistrarUsuario.bind(this)}
          >
            Registarse
          </Button>
        </div>
      </div>
    );
  }
}

export default withRouter(Register);
