import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import ReactPDF from "@react-pdf/renderer";

function Mydocument() {
  // Create styles
  const styles = StyleSheet.create({
    page: {
      flexDirection: "row",
      backgroundColor: "#E4E4E4",
    },
    section: {
      margin: 1,
      padding: 10,
      flexGrow: 1,
    },
  });

  return (
    <Document file="./practice.pdf">
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text>Section #1</Text>
        </View>
      </Page>
    </Document>
  );
}

export default Mydocument;
