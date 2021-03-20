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
app.post("/api/Login----", (req, res) => {
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
app.post("/api/Registro----", (req, res) => {
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
app.post("/api/Modificar----", (req, res) => {
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

//---------Insertar Imagen------------------
app.post("/api/InsertarImagen----", (req, res) => {
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

//======================================ALEX============================================
/*
CREATE TABLE client (
    idiclient int NOT NULL AUTO_INCREMENT,
    name varchar(250),    
    username varchar(250),
    password varchar(250),
    urlfoto text,    
    PRIMARY KEY (idiclient)  
);
CREATE TABLE book ( 
    idbook int NOT NULL AUTO_INCREMENT,
    nombre varchar(250),
    tipo int,
    idiclient int,
    PRIMARY KEY (idbook),
    FOREIGN KEY (idiclient) REFERENCES client (idiclient) ON DELETE CASCADE  
);  
CREATE TABLE picture ( 
    idpicture int NOT NULL AUTO_INCREMENT,
    nombre varchar(250),
    urlfoto text,
    descripcion text,
    idbook int,
    PRIMARY KEY (idpicture),
    FOREIGN KEY (idbook) REFERENCES book (idbook) ON DELETE CASCADE  
);
*/

//-------------Registro------------
app.post("/api/Registro", async function (req, res) {
  const { name } = req.body;
  const { username } = req.body;
  const { password } = req.body;
  const { foto } = req.body;
  try {
    //verificar si existe el usuario
    let query = "Select * from client where username=?";
    let [rows, fields] = await connProme.query(query, username);
    if (rows.length == 0) {
      //crear la imagen para subir al s3
      var sub = foto.split(";");
      var extension = "." + sub[0].replace(/^data:image\//, "");
      let urlbucket =
        "https://practica1-g4-imagenes.s3.us-east-2.amazonaws.com/Fotos_Perfil/";
      let NombreImagen = "FotoPerfil" + new Date().getTime() + extension;
      let DireccionPerfil = urlbucket + NombreImagen;

      //-----------------------------registrar en la base de datos
      //usuario
      query =
        "INSERT INTO client (name, username, password,urlfoto) VALUES (?,?,MD5(?),?);";
      [rows, fields] = await connProme.execute(query, [
        name,
        username,
        password,
        DireccionPerfil,
      ]);

      //obtener el id que le genera la base de datos
      query = "SELECT idiclient FROM client where username =?;";
      [rows, fields] = await connProme.execute(query, [username]);
      let idiclient = rows[0].idiclient;

      //crear el album db
      query = "INSERT INTO book (nombre, tipo,idiclient) VALUES (?, ?,?);";
      [rows, fields] = await connProme.execute(query, ["perfil", 0, idiclient]);

      //obtener el id que le genera la base de datos
      query = "SELECT idbook FROM book where idiclient =? and nombre='perfil';";
      [rows, fields] = await connProme.execute(query, [idiclient]);
      let idbook = rows[0].idbook;

      //insertar la imagen db
      query =
        "INSERT INTO picture (nombre,urlfoto,descripcion,idbook) VALUES (?,?,?,?);";
      [rows, fields] = await connProme.execute(query, [
        NombreImagen,
        DireccionPerfil,
        "",
        idbook,
      ]);

      let newuser = {
        idiclient: idiclient,
        name: name,
        username: username,
        password: password,
        foto: DireccionPerfil,
      };

      //-----------------------------------subir al s3
      var imagenperfil = foto;
      var ruta = imagenperfil.replace(/^data:image\/[a-z]+;base64,/, "");
      let buff = new Buffer.from(ruta, "base64");
      const params = {
        Bucket: "practica1-g4-imagenes",
        Key: "Fotos_Perfil/" + NombreImagen,
        Body: buff,
        ContentType: "image",
        ACL: "public-read",
      };
      const putResult = await s3.putObject(params).promise();
      console.log(putResult);

      //retornar al cliente
      return res.send({
        status: 200,
        msg: "Usuario Registrado con exito",
        user: newuser,
      });
    } else {
      return res.send({
        status: 400,
        msg: "El usuario ya existe, intenta con otro User Name",
      });
    }
  } catch (error) {
    console.log(error);
    return res.send({
      status: 500,
      msg: "Ocurrio error en el server",
    });
  }
});

//-------------login---------------
app.post("/api/LoginDatos", async function (req, res) {
  const { username } = req.body;
  const { password } = req.body;
  try {
    let query = "Select * from client where username=? and password=MD5(?)";
    let [rows, fields] = await connProme.query(query, [username, password]);
    if (rows.length == 1) {
      return res.send({
        status: 200,
        user: rows[0],
      });
    } else {
      return res.send({
        status: 400,
        msg: "Datos no encontrados",
      });
    }
  } catch (error) {
    console.log(error);
    return res.send({
      status: 500,
      msg: "Ocurrio error en el server",
    });
  }
});

//---------------------------------
app.post("/api/Modificar", async function (req, res) {
  const { newuser } = req.body;
  const { user } = req.body;
  const { name } = req.body;
  const { foto } = req.body;
  try {
    //verificar si existe el usuario
    let query = "Select * from client where username=?";
    let [rows, fields] = await connProme.query(query, newuser);
    if (rows.length == 0 || newuser === user) {
      if (foto === false) {
        //cambiar usuario sin foto
        query = "UPDATE client SET username=?, name=? WHERE username=?;";
        [rows, fields] = await connProme.execute(query, [newuser, name, user]);
      } else {
        //crear la imagen para subir al s3
        var sub = foto.split(";");
        var extension = "." + sub[0].replace(/^data:image\//, "");
        let urlbucket =
          "https://practica1-g4-imagenes.s3.us-east-2.amazonaws.com/Fotos_Perfil/";
        let NombreImagen = "FotoPerfil" + new Date().getTime() + extension;
        let DireccionPerfil = urlbucket + NombreImagen;

        //cambiar datos usuario con foto
        query =
          "UPDATE client SET username=?, name=?, urlfoto=? WHERE username=?;";
        [rows, fields] = await connProme.execute(query, [
          newuser,
          name,
          DireccionPerfil,
          user,
        ]);

        //obtener el id del cliente
        query = "SELECT idiclient FROM client where username =?;";
        [rows, fields] = await connProme.execute(query, [newuser]);
        let idiclient = rows[0].idiclient;
        //obtener el id del album perfil
        query = "SELECT idbook FROM book where idiclient =? and nombre=?";
        [rows, fields] = await connProme.execute(query, [idiclient, "perfil"]);
        let idbook = rows[0].idbook;
        //insertar la imagen
        query =
          "INSERT INTO picture (nombre,urlfoto,descripcion,idbook) VALUES (?,?,?,?);";
        [rows, fields] = await connProme.execute(query, [
          NombreImagen,
          DireccionPerfil,
          "",
          idbook,
        ]);

        //-----------------------------------subir al s3
        var imagenperfil = foto;
        var ruta = imagenperfil.replace(/^data:image\/[a-z]+;base64,/, "");
        let buff = new Buffer.from(ruta, "base64");
        const params = {
          Bucket: "practica1-g4-imagenes",
          Key: "Fotos_Perfil/" + NombreImagen,
          Body: buff,
          ContentType: "image",
          ACL: "public-read",
        };
        const putResult = await s3.putObject(params).promise();
        console.log(putResult);
      }

      //tomar los datos para actualizar el front
      query = "Select * from client where username=?";
      [rows, fields] = await connProme.query(query, newuser);
      let userResp = rows[0];
      return res.send({
        status: 200,
        msg: "Datos modificados",
        user: userResp,
      });
    } else {
      return res.send({
        status: 400,
        msg: "El usuario ya existe",
      });
    }
  } catch (error) {
    console.log(error);
    return res.send({
      status: 400,
      msg: "Ocurrio error en el server",
    });
  }
});

//-------------Listar Album + Fotos------------
app.post("/api/ListaAlbums", async function (req, res) {
  const { usuario } = req.body;
  try {
    let query =
      "Select * from book where idiclient=(Select idiclient from client where username=?)";
    let [rows, fields] = await connProme.query(query, [usuario]); //asi se agregan parametros evitando inyeccion sql
    for (const i in rows) {
      query = "Select * from picture where idbook=?";
      let [rows2, fields2] = await connProme.query(query, [rows[i].idbook]);
      rows[i].listF = rows2;
    }
    return res.send(rows);
  } catch (error) {
    console.log(error);
    return res.send({
      status: 400,
      msg: "Ocurrio error en el server",
    });
  }
});













//-------------Etiquetas del Perfil------------
app.post("/api/EtiquetasPerfil", async function (req, res) {
  const { foto } = req.body;
  try {
    console.log(foto);
    let ejemplo = [];
    for (let index = 0; index < Math.floor(Math.random() * 10) + 5; index++) {
      ejemplo.push({
        etiqueta: String(Math.random().toString(36).substring(7)),
      });
    }
    /*
    esto es lo que leo desde el frontEnd
    ejemplo=[
      {etiqueta:"valor"},
      {etiqueta:"valor"},
      {etiqueta:"valor"},
    ]
    */
    return res.send(ejemplo);
  } catch (error) {
    console.log(error);
    return res.send({
      status: 400,
      msg: "Ocurrio error en el server",
    });
  }
});

//-------------Etiquetas del Perfil------------
app.post("/api/Traducir", async function (req, res) {
  const { idioma } = req.body;
  const { texto } = req.body;
  try {
    return res.send({
      status: 200,
      texto: "Bueno aca va la traduccion desde el server",
    });
  } catch (error) {
    console.log(error);
    return res.send({
      status: 500,
      msg: "Ocurrio error en el server",
    });
  }
});

//iniciando servidor
app.listen(app.get("port"), () => {
  console.log(`http://localhost:${app.get("port")}`);
});
