const mysql2 = require("mysql2/promise");
const express = require("express");
const app = express();
var axios = require("axios");

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
var connProme = mysql2.createPool(db_credenciales);

//instanciamos el sdk
var AWS = require("aws-sdk");
//instacinamos los servicios
const s3 = new AWS.S3(aws_keys.s3);
const rek = new AWS.Rekognition(aws_keys.rekognition);
const translate = new AWS.Translate(aws_keys.translate);

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

//-------------login rekognition---------------
app.post("/api/LoginFoto", async function (req, res) {
  const { foto } = req.body;
  try {
    //obtener todos los clientes
    let query = "Select * from client";
    let [rows, fields] = await connProme.query(query);
    if (rows.length != 0) {
      //---------------------------------crear la imagen
      var imagenperfil = foto;
      var ruta = imagenperfil.replace(/^data:image\/[a-z]+;base64,/, "");
      let buff = new Buffer.from(ruta, "base64");

      //----------recorrer los perfiles de db
      for (let i = 0; i < rows.length; i++) {
        const fotodb = rows[i].urlfoto;
        //base64 from url
        let image = await axios.get(fotodb, {
          responseType: "arraybuffer",
        });
        let returnedB64 = Buffer.from(image.data, "base64");

        //----------comparar foto con fotodb
        var params = {
          SourceImage: {
            Bytes: buff,
          },
          TargetImage: {
            Bytes: returnedB64,
          },
          SimilarityThreshold: "80",
        };
        let resultCompa = (await rek.compareFaces(params).promise())
          .FaceMatches;
        if (resultCompa.length > 0) {
          return res.send({
            status: 200,
            user:rows[i],
          });
        }
      }
      return res.send({
        status: 400,
        msg: "Datos no encontrados",
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

//-------------Insertar Imagen------------
app.post("/api/InsertarImagen", async function (req, res) {
  const { descripcion } = req.body;
  const { nombre } = req.body;
  const { foto } = req.body;
  const { idiclient } = req.body;
  try {
    //---------------------------------crear la imagen
    var sub = foto.split(";");
    var extension = "." + sub[0].replace(/^data:image\//, "");
    let urlbucket =
      "https://practica1-g4-imagenes.s3.us-east-2.amazonaws.com/Fotos_Publicadas/";
    let NombreImagen = "Foto" + new Date().getTime() + extension;
    let DireccionPerfil = urlbucket + NombreImagen;
    //-----------------------------------subir al s3
    var imagenperfil = foto;
    var ruta = imagenperfil.replace(/^data:image\/[a-z]+;base64,/, "");
    let buff = new Buffer.from(ruta, "base64");
    const params = {
      Bucket: "practica1-g4-imagenes",
      Key: "Fotos_Publicadas/" + NombreImagen,
      Body: buff,
      ContentType: "image",
      ACL: "public-read",
    };
    const putResult = await s3.putObject(params).promise();
    console.log(putResult);

    //---------------------------analizar las etiquetas
    var datarek = {
      Image: {
        Bytes: buff,
      },
      MaxLabels: 5,
    };
    let etiquetas = (await rek.detectLabels(datarek).promise()).Labels;

    //recorrer las etiquetas
    for (let index = 0; index < etiquetas.length; index++) {
      //crear los albumnes
      //obtener el id del album
      let query = "SELECT idbook FROM book where idiclient =? and nombre=?";
      let [rows, fields] = await connProme.execute(query, [
        idiclient,
        etiquetas[index].Name,
      ]);
      if (rows.length == 0) {
        //crear el album db
        query = "INSERT INTO book (nombre, tipo,idiclient) VALUES (?, ?,?);";
        [rows, fields] = await connProme.execute(query, [
          etiquetas[index].Name,
          1,
          idiclient,
        ]);

        //obtener el id del album
        query = "SELECT idbook FROM book where idiclient =? and nombre=?";
        [rows, fields] = await connProme.execute(query, [
          idiclient,
          etiquetas[index].Name,
        ]);
      }
      //insertar la imagen db
      query =
        "INSERT INTO picture (nombre,urlfoto,descripcion,idbook) VALUES (?,?,?,?);";
      [rows, fields] = await connProme.execute(query, [
        nombre,
        DireccionPerfil,
        descripcion,
        rows[0].idbook,
      ]);
    }

    //---------------------respuesta al cliente
    return res.send({
      status: 200,
      msg: "Foto Guardada",
    });
  } catch (error) {
    console.log(error);
    return res.send({
      status: 500,
      msg: "Ocurrio error en el server",
    });
  }
});

//-------------Etiquetas del Perfil------------
app.post("/api/EtiquetasPerfil", async function (req, res) {
  const { foto } = req.body;
  try {
    //base64 from url
    let image = await axios.get(foto, {
      responseType: "arraybuffer",
    });
    let returnedB64 = Buffer.from(image.data, "base64");
    //analizar las etiquetas
    var datarek = {
      Image: {
        Bytes: returnedB64,
      },
      Attributes: ["ALL"],
    };
    let etiquetas = (await rek.detectFaces(datarek).promise()).FaceDetails;

    let ejemplo = [];
    if (etiquetas.length > 0) {
      //agregar rango de edad
      ejemplo.push({
        etiqueta:
          "edad " +
          String(etiquetas[0].AgeRange.Low) +
          "-" +
          String(etiquetas[0].AgeRange.High),
      });
      //agregar genero
      ejemplo.push({
        etiqueta: String(etiquetas[0].Gender.Value),
      });
      //Ojos abiertos
      ejemplo.push({
        etiqueta: "Ojos Abiertos: " + String(etiquetas[0].EyesOpen.Value),
      });
      //Emociones
      ejemplo.push({
        etiqueta: "Emotion: " + String(etiquetas[0].Emotions[0].Type),
      });
      //sonrisa
      ejemplo.push({
        etiqueta: "Sonrisa: " + String(etiquetas[0].Smile.Value),
      });
    } else {
      ejemplo.push({
        etiqueta: "No es posible analizar la imagen",
      });
    }
    return res.send(ejemplo);
  } catch (error) {
    console.log(error);
    return res.send({
      status: 400,
      msg: "Ocurrio error en el server",
    });
  }
});

//-------------Traduccion Foto------------
app.post("/api/Traducir", async function (req, res) {
  const { idioma } = req.body;
  const { texto } = req.body;
  try {
    let lenguaje = "ja";
    if (idioma == "Ingles") {
      lenguaje = "en";
    } else if (idioma == "Español") {
      lenguaje = "es";
    } else if (idioma == "Ruso") {
      lenguaje = "ru";
    }
    let params = {
      SourceLanguageCode: "auto",
      TargetLanguageCode: lenguaje,
      Text: texto || "Hello there",
    };
    let trad = await (await translate.translateText(params).promise())
      .TranslatedText;
    return res.send({
      status: 200,
      texto: trad,
    });
  } catch (error) {
    console.log(error);
    return res.send({
      status: 500,
      msg: "Ocurrio error en el server",
    });
  }
});

//-------------Detectar Texto------------
app.post("/api/DetectarTexto", async function (req, res) {
  const { foto } = req.body;
  try {
    //---------------------------------crear la imagen
    var imagenperfil = foto;
    var ruta = imagenperfil.replace(/^data:image\/[a-z]+;base64,/, "");
    let buff = new Buffer.from(ruta, "base64");
    //analizar las etiquetas
    var datarek = {
      Image: {
        Bytes: buff,
      },
    };
    let textoFoto = await (await rek.detectText(datarek).promise())
      .TextDetections;
    let txt = "";
    for (const i in textoFoto) {
      if (textoFoto[i].Type == "LINE") {
        txt = txt + String(textoFoto[i].DetectedText) + "\n";
      }
    }
    return res.send({
      status: 200,
      texto: txt,
    });
  } catch (error) {
    console.log(error);
    return res.send({
      status: 400,
      msg: "Ocurrio error en el server",
    });
  }
});

//iniciando servidor
app.listen(app.get("port"), () => {
  console.log(`http://localhost:${app.get("port")}`);
});
