import React from "react";
import Amplify, { Interactions } from "aws-amplify";
import { ChatBot, AmplifyTheme } from "aws-amplify-react";
import awsconfig from "../../aws-export";
import Navbar from "./Navbar";
import { makeStyles } from "@material-ui/core/styles";
import Credenciales from "../Credenciales";

Amplify.configure(awsconfig);
// Imported default theme can be customized by overloading attributes
export class ChatPageOtro extends React.Component {
  render() {
    return (
      <div style={{ minWidth: "100%" }}>
        <Navbar
          props={this.props}
          tituloP={"Inicio"}
          foto={Credenciales.Perfil}
        />
        <FullChatPageOtro props={this.props} />
      </div>
    );
  }
}
const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    padding: theme.spacing(2),
  },
}));
export default function FullChatPageOtro({ props }) {
  const classes = useStyles();

  const handleComplete = (err, confirmation) => {
    if (err) {
      alert("Bot conversation failed");
      return;
    }

    alert("Success: " + JSON.stringify(confirmation, null, 2));
    return "Trip booked. Thank you! what would you like to do next?";
  };
  return (
    <div className={classes.root}>
      <h1>ChatBot Demo Otro</h1>
      <ChatBot
        title="My ChatBot"
        botName="OrderFlowers_esLATAM"
        welcomeMessage="Hola Prro, Que pex?"
        onComplete={handleComplete}
        clearOnComplete={true}
        conversationModeOn={false}
      />
    </div>
  );
}
