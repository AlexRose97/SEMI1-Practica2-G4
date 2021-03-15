import React, { useState } from "react";
import Navbar from "./Navbar";
import { makeStyles } from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  GridList,
  GridListTile,
  GridListTileBar,
  Paper,
  Select,
  Typography,
} from "@material-ui/core";
import Swal from "sweetalert2";
import Credenciales from "../Credenciales";
/**
 * LeSofia
 * Aldo
 *
 *
 */

export class AlbumesU extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <div style={{ minWidth: "100%" }}>
        <Navbar props={this.props} tituloP={"Albumes"} />
        <FullAlbum props={this.props} />
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
  potho: {
    maxWidth: 200,
    maxHeight: 200,
  },
}));

export default function FullAlbum({ props }) {
  const classes = useStyles();
  const [consulta, setconsulta] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [infoIMG, setinfoIMG] = React.useState([]);
  const [idiomatxt, setidiomatxt] = React.useState("");

  var data = { usuario: Credenciales.User };
  React.useEffect(() => {
    fetch("http://" + Credenciales.host + ":3030/api/ListaAlbums/", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((response) => response.json())
      .then((json) => {
        return json;
      })
      .then((json) => {
        console.log(json);
        setconsulta(json);
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  const GenerarFotos = (listFots) => {
    const tileData = [];
    if (listFots != undefined) {
      for (let index = 0; index < listFots.length; index++) {
        tileData.push({
          img: listFots[index].Direccion,
          title: listFots[index].NombreImagen,
          author: Credenciales.User,
          descripcion:
            "Cras mattis consectetur purus sit amet fermentum. Cras justo odio," +
            "dapibus ac facilisis in, egestas eget quam. Morbi leo risus, porta" +
            "ac consectetur ac, vestibulum at eros",
          cols: 1,
        });
      }
    }
    return tileData;
  };

  const GenerarAlbums = () => {
    const nuevoAlbums = [];
    for (let index = 0; index < consulta.length; index++) {
      const listFots = consulta[index].listF;
      const tileData = GenerarFotos(listFots);
      nuevoAlbums.push(
        <Grid xs={12}>
          <h2>Album {consulta[index].NombreAlbum}</h2>
          <div className={classes.containerList}>
            <GridList className={classes.gridList} cols={3}>
              {tileData.map((tile) => (
                <GridListTile
                  key={
                    Math.random().toString(36).substring(7) + String(tile.img)
                  }
                  cols={tile.cols || 1}
                >
                  <Paper>
                    <img
                      src={tile.img}
                      alt={tile.title}
                      className={classes.potho}
                      onClick={() => {
                        MostarFoto(tile);
                      }}
                    />
                    <GridListTileBar title={tile.title} />
                  </Paper>
                </GridListTile>
              ))}
            </GridList>
          </div>
        </Grid>
      );
    }
    return nuevoAlbums;
  };

  const MostarFoto = (infoFoto) => {
    setinfoIMG(infoFoto);
    setOpen(true);
  };

  //cerrar cuadro emergente de fotos
  const handleClose = () => {
    setOpen(false);
  };

  //seleccionar el item/idioma
  const selecIdioma = (event) => {
    const name = event.target.value;
    setidiomatxt(name);
  };
  //traducir
  const traducirInfo = () => {
    setOpen(false);
    if (idiomatxt !== "") {
      Swal.fire({
        title: idiomatxt,
        text: infoIMG.descripcion,
        icon: "success",
      }).then((result) => {
        setOpen(true);
      });
    } else {
      Swal.fire({
        title: "Error!",
        text: "Debes Seleccionar Un Idioma",
        icon: "error",
      }).then((result) => {
        setOpen(true);
      });
    }
    setidiomatxt("")
  };

  return (
    <div className={classes.root}>
      <Grid container spacing={4}>
        <Grid item xs={12}>
          <Divider />
          <h2>Mis Albumes</h2>
        </Grid>
        {GenerarAlbums()}
      </Grid>
      <Dialog onClose={handleClose} open={open} scroll={"paper"}>
        <DialogTitle onClose={handleClose} style={{ textAlign: "center" }}>
          {infoIMG.title}
        </DialogTitle>
        <DialogContent dividers>
          <Typography gutterBottom align={"center"}>
            <img
              src={infoIMG.img}
              style={{ maxWidth: "100%", maxHeight: 500 }}
            />
          </Typography>
          <Typography gutterBottom>{infoIMG.descripcion}</Typography>
          <Typography gutterBottom align={"center"}>
            <Select
              native
              onChange={selecIdioma}
              defaultValue={idiomatxt}
              inputProps={{
                name: "age",
                id: "filled-age-native-simple",
              }}
            >
              <option aria-label="None" value="" />
              <option value={"Ingles"}>Ingles</option>
              <option value={"Español"}>Español</option>
              <option value={"Ruso"}>Ruso</option>
            </Select>
            <Button onClick={traducirInfo}>Traducir</Button>
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button autoFocus onClick={handleClose} color="primary">
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
