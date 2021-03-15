const mysql = require("mysql");
const mysql2 = require("mysql2/promise");
const express = require("express");
const app = express();

//funcion que procesa datos antes de que el servidor lo reciba
const morgan = require("morgan");
// puerto en el que escucha
app.set("port", process.env.PORT || 3030);
app.set("json spaces", 2);

//seguridad
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
  res.header("Allow", "GET, POST, OPTIONS, PUT, DELETE");
  next();
});

app.use(morgan("dev"));
//app.use(express.urlencoded({extended: false}));
//app.use(express.json());

//--------------extra
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb" }));

//----------AWS
const aws_keys = require("./credenciales");
const db_credenciales = require("./db_credenciales");
var conn = mysql.createPool(db_credenciales);
var connProme = mysql2.createPool(db_credenciales);
const now = Math.random().toString(36).substring(7);

//instanciamos el sdk
var AWS = require("aws-sdk");
const { user } = require("./db_credenciales");
//instacinamos los servicios
const s3 = new AWS.S3(aws_keys.s3);

var autorizacioncompleta = true;
var NombreCompleto = "";
var UsuarioCompleto = "";
var ImagenPerfil = "";
var Contrasena = "";
var autorizacionregistro = true;

//---------------Ya Esta
app.post("/api/Login", (req, res) => {
  const { user } = req.body;
  const { pass } = req.body;
  console.log("User: " + user + " Contraseña : " + pass);

  conn.query(
    `Select U.NombreUsuario,U.Nombre,U.Contrasena,I.Direccion from Usuario U,Imagen I,Album A where U.NombreUsuario='` +
      user +
      `' and  U.Contrasena=MD5('` +
      pass +
      `') and U.ID_Usuario =A.ID_Usuario and A.ID_Album=I.ID_Album and A.TipoAlbum=1 and I.Activa=1`,
    function (err, result) {
      if (err) throw err;
      //res.send(result);
      console.log("Coincidencias:" + [].concat.apply([], result).length);
      var Cantidad = [].concat.apply([], result).length;

      console.log("le" + Cantidad);
      if (Cantidad == 1) {
        console.log("Entre");
        autorizacioncompleta = true;
        NombreCompleto = result[0].Nombre;
        Contrasena = result[0].Contrasena;
        ImagenPerfil = result[0].Direccion;
        UsuarioCompleto = result[0].NombreUsuario;
      } else {
        autorizacioncompleta = false;
        NombreCompleto = "result.Nombre";
        Contrasena = "result.Contrasena";
        ImagenPerfil = "result.Direccion";
        UsuarioCompleto = "result.NombreUsuario";
      }

      console.log(
        autorizacioncompleta +
          NombreCompleto +
          UsuarioCompleto +
          Contrasena +
          ImagenPerfil
      );
      res.json({
        autorizacion: autorizacioncompleta,
        usuario: UsuarioCompleto,
        nombre: NombreCompleto,
        contrasena: Contrasena,
        imagen: ImagenPerfil,
      });
    }
  );
});

//---------------ya esta registro
app.post("/api/Registro", (req, res) => {
  console.log(now);
  const { user } = req.body;
  const { name } = req.body;
  const { pass } = req.body;
  const { imagen } = req.body;
  var sub = imagen.split(";");
  var extension = sub[0].replace(/^data:image\//, "");

  const NumeroUsuarios = { num: 0 };
  const IdUsuario = { id: 0 };
  const IdAlbum = { id: 0 };
  let urlbucket =
    "https://practica1-g4-imagenes.s3.us-east-2.amazonaws.com/Fotos_Perfil/";
  let NombreImagen = "FotoPerfil" + now + "." + extension;
  const IdFotografia = { id: 0 };
  const DireccionPerfil = { direccion: urlbucket + NombreImagen };
  var autorizacionregistro;

  //Verificamos si hay un usuario con el mismo Nombre

  conn.query(
    `Select * from Usuario where NombreUsuario='` + user + `'`,
    function (err, result) {
      if (err) throw err;
      //res.send(result);
      console.log("Coincidencias:" + [].concat.apply([], result).length);
      NumeroUsuarios.num = [].concat.apply([], result).length;

      console.log("Nu_Usuario" + NumeroUsuarios.num + "\n");
      if (NumeroUsuarios.num == 0) {
        autorizacionregistro = true;

        conn.query(
          `Insert Into Usuario (NombreUsuario,Nombre,Contrasena) values ('` +
            user +
            `','` +
            name +
            `',MD5('` +
            pass +
            `'))`,
          function (err, result) {
            if (err) throw err;
            console.log("Resultado Insert" + result + "\n");
            //res.send(result);

            //-----------------------Selecionamos el ID del Usuario Inresado-----------------

            conn.query(
              `Select ID_Usuario,Contrasena from Usuario where NombreUsuario='` +
                user +
                `'`,
              function (err, result) {
                if (err) throw err;
                IdUsuario.id = result[0].ID_Usuario;
                console.log("Id_Usuario.id: " + IdUsuario.id);
                Contrasena = result[0].Contrasena;

                //Ahora que ya tengo el ID_Usuario tengo que crear Album
                conn.query(
                  `Insert into Album (NombreAlbum,ID_Usuario,TipoAlbum) values ('Perfil',` +
                    IdUsuario.id +
                    `,1)`,
                  function (err, result) {
                    if (err) throw err;
                  }
                );
                //Seleccionamos el ID_Album del Usuario que estamos registrando
                conn.query(
                  `select ID_Album from Album where ID_Usuario=` +
                    IdUsuario.id +
                    ` and NombreAlbum='Perfil' and TipoAlbum=1`,
                  function (err, result) {
                    if (err) throw err;
                    //console.log(result);
                    IdAlbum.id = result[0].ID_Album;

                    //Ahora que ya tengo el ID del Album necesito crear una Imagen

                    conn.query(
                      `Insert into Imagen (NombreImagen,Direccion,ID_Album,Activa) values ('Perfil','` +
                        DireccionPerfil.direccion +
                        `',` +
                        IdAlbum.id +
                        `,1)`,
                      function (err, result) {
                        if (err) throw err;
                      }
                    );

                    console.log("pase");
                    var imagenperfil = imagen;
                    var ruta = imagenperfil.replace(
                      /^data:image\/[a-z]+;base64,/,
                      ""
                    );

                    // ruta=imagen;
                    //Ahora que cree la imagen de Perfil debo subir la imagen a la nube
                    let buff = new Buffer.from(ruta, "base64");
                    const params = {
                      Bucket: "practica1-g4-imagenes",
                      Key: "Fotos_Perfil/" + NombreImagen,
                      Body: buff,
                      ContentType: "image",
                      ACL: "public-read",
                    };
                    const putResult = s3.putObject(params).promise();
                    console.log(putResult);

                    autorizacioregistro = true;
                    NombreCompleto = name;
                    ImagenPerfil = DireccionPerfil.direccion;
                    UsuarioCompleto = user;

                    console.log(
                      autorizacionregistro +
                        NombreCompleto +
                        UsuarioCompleto +
                        Contrasena +
                        ImagenPerfil
                    );
                    res.json({
                      autorizacion: autorizacionregistro,
                      usuario: UsuarioCompleto,
                      nombre: NombreCompleto,
                      contrasena: Contrasena,
                      imagen: ImagenPerfil,
                    });
                  }
                );
              }
            );
          }
        );
      } else {
        console.log("No se pudo Registrar-Ya hay un");
        autorizacioregistro = false;
        NombreCompleto = "result.Nombre";
        Contrasena = "result.Contrasena";
        ImagenPerfil = "result.Direccion";
        UsuarioCompleto = "result.NombreUsuario";
        Contrasena = "result.Contrasena";
        console.log(
          autorizacionregistro +
            NombreCompleto +
            UsuarioCompleto +
            Contrasena +
            ImagenPerfil
        );
        res.json({
          autorizacion: autorizacionregistro,
          usuario: UsuarioCompleto,
          nombre: NombreCompleto,
          contrasena: Contrasena,
          imagen: ImagenPerfil,
        });
      }
    }
  );
});

//---------------_Modificar----- Ya Esta
app.post("/api/Modificar", (req, res) => {
  const { useractual } = req.body;
  const { usercambio } = req.body;
  const { name } = req.body;
  const { imagen } = req.body;
  var autorizacionmodificar;
  var IDUsuario;
  const NumeroUsuarios = { num: 0 };

  //Verificar los usuarios
  conn.query(
    `Select ID_Usuario from Usuario where NombreUsuario='` + usercambio + `'`,
    function (err, result) {
      if (err) throw err;
      NumeroUsuarios.num = [].concat.apply([], result).length;
      //IDUsuario = result[0].ID_Usuario;
      if (
        (NumeroUsuarios.num == 1 && usercambio == useractual) ||
        NumeroUsuarios.num == 0
      ) {
        var urlnew = false;
        conn.query(
          `Update Usuario set NombreUsuario='` +
            usercambio +
            `' ,Nombre='` +
            name +
            `' where NombreUsuario='` +
            useractual +
            `'`,
          function (err, result) {
            if (err) throw err;
          }
        );

        if (imagen != false) {
          //Crear Imagen y actualizar Datos

          var sub = imagen.split(";");
          var extension = sub[0].replace(/^data:image\//, "");
          let urlbucket =
            "https://practica1-g4-imagenes.s3.us-east-2.amazonaws.com/Fotos_Perfil/";
          let NombreImagen = "FotoPerfil" + now + "." + extension;
          const DireccionPerfil = { direccion: urlbucket + NombreImagen };

          conn.query(
            `Select ID_Album from Album where ID_Usuario=(Select ID_Usuario from Usuario where NombreUsuario='` +
              usercambio +
              `')and TipoAlbum=1`,
            function (err, result) {
              if (err) throw err;
              var IDAlbum = result[0].ID_Album;
              //Insertar la Foto---------------------
              conn.query(
                `Update Imagen set Activa=0 where ID_Album=` + IDAlbum,
                function (err, result) {
                  if (err) throw err;
                }
              );

              conn.query(
                `Insert into Imagen (NombreImagen,Direccion,ID_Album,Activa) values ('Perfil','` +
                  DireccionPerfil.direccion +
                  `',` +
                  IDAlbum +
                  `,1)`,
                function (err, result) {
                  if (err) throw err;

                  var imagenperfil = imagen;
                  var ruta = imagenperfil.replace(
                    /^data:image\/[a-z]+;base64,/,
                    ""
                  );
                  //ruta=imagen;
                  //Ahora que cree la imagen de Perfil debo subir la imagen a la nube
                  let buff = new Buffer.from(ruta, "base64");
                  const params = {
                    Bucket: "practica1-g4-imagenes",
                    Key: "Fotos_Perfil/" + NombreImagen,
                    Body: buff,
                    ContentType: "image",
                    ACL: "public-read",
                  };
                  const putResult = s3.putObject(params).promise();
                }
              );

              autorizacionmodificar = true;
              NombreCompleto = name;
              ImagenPerfil = DireccionPerfil.direccion;
              UsuarioCompleto = usercambio;

              console.log(
                autorizacionmodificar +
                  NombreCompleto +
                  UsuarioCompleto +
                  Contrasena +
                  ImagenPerfil
              );
              res.json({
                autorizacion: autorizacionmodificar,
                usuario: UsuarioCompleto,
                nombre: NombreCompleto,
                imagen: ImagenPerfil,
              });
            }
          );
        } else {
          autorizacionmodificar = true;
          NombreCompleto = name;
          ImagenPerfil = false;
          UsuarioCompleto = usercambio;

          console.log(
            autorizacionmodificar +
              NombreCompleto +
              UsuarioCompleto +
              Contrasena +
              ImagenPerfil
          );
          res.json({
            autorizacion: autorizacionmodificar,
            usuario: UsuarioCompleto,
            nombre: NombreCompleto,
            imagen: ImagenPerfil,
          });
        }
      } else {
        console.log("Error el usuario ya existe");
        autorizacionmodificar = false;
        NombreCompleto = "name";
        ImagenPerfil = false;
        UsuarioCompleto = "user";
        console.log(
          autorizacionmodificar +
            NombreCompleto +
            UsuarioCompleto +
            Contrasena +
            ImagenPerfil
        );
        res.json({
          autorizacion: autorizacionmodificar,
          usuario: UsuarioCompleto,
          nombre: NombreCompleto,
          imagen: ImagenPerfil,
        });
      }
    }
  );
});


//-------------Eliminar Album------------
app.post("/api/EliminarAlbum", (req, res) => {
  const { idalbum } = req.body;

  conn.query(
    `Delete from Imagen where ID_Album=` + idalbum + ``,
    function (err, result) {
      if (err) throw err;
      //res.send(result);
    }
  );

  conn.query(
    `Delete from Album where ID_Album=` + idalbum + ``,
    function (err, result) {
      if (err) throw err;
      res.send(result);
    }
  );
});

//--------Insertar Album--------------------
app.post("/api/AgregarrAlbum", (req, res) => {
  const { nombrealbum } = req.body;
  const { nombreuser } = req.body;
  conn.query(
    `Insert into Album (NombreAlbum,TipoAlbum,ID_Usuario) values ('` +
      nombrealbum +
      `',0,(Select ID_Usuario from Usuario where NombreUsuario='` +
      nombreuser +
      `' ))`,
    function (err, result) {
      if (err) throw err;
      res.send(result);
    }
  );
});

//---------Insertar Imagen------------------
app.post("/api/InsertarImagen", (req, res) => {
  const { idalbum } = req.body;
  const { name } = req.body;
  const { imagen } = req.body;

  var sub = imagen.split(";");
  var extension = sub[0].replace(/^data:image\//, "");
  let urlbucket =
    "https://practica1-g4-imagenes.s3.us-east-2.amazonaws.com/Fotos_Publicadas/";
  let NombreImagen = name + now + "." + extension;
  const DireccionPerfil = { direccion: urlbucket + NombreImagen };

  conn.query(
    `Insert into Imagen (NombreImagen,Direccion,ID_Album,Activa) values ('` +
      name +
      `','` +
      DireccionPerfil.direccion +
      `',` +
      idalbum +
      `,0)`,
    function (err, result) {
      if (err) throw err;

      var imagenperfil = imagen;
      var ruta = imagenperfil.replace(/^data:image\/[a-z]+;base64,/, "");
      //ruta=imagen;
      //Ahora que cree la imagen de Perfil debo subir la imagen a la nube
      let buff = new Buffer.from(ruta, "base64");
      const params = {
        Bucket: "practica1-g4-imagenes",
        Key: "Fotos_Publicadas/" + NombreImagen,
        Body: buff,
        ContentType: "image",
        ACL: "public-read",
      };
      const putResult = s3.putObject(params).promise();
    }
  );
});

//-------------Listar Album + Fotos------------
app.post("/api/ListaAlbums", async function (req, res) {
  const { usuario } = req.body;
  try {
    let query =
      "Select * from Album where ID_Usuario=(Select ID_Usuario from Usuario where NombreUsuario=?)";
    let [rows, fields] = await connProme.query(query, usuario); //asi se agregan parametros evitando inyeccion sql
    for (const i in rows) {
      query = "Select * from Imagen where ID_Album=?";
      let [rows2, fields] = await connProme.query(query, rows[i].ID_Album);
      rows[i].listF = rows2;
    }
    return res.send(rows);
  } catch (error) {
    console.log(error);
    return res.send({
      status: 400,
      msg: "F--Entro al Catch",
    });
  }
});

//iniciando servidor
app.listen(app.get("port"), () => {
  console.log(`http://localhost:${app.get("port")}`);
});
