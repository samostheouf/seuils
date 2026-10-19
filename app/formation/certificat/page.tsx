"use client";

import { useState } from "react";
import Link from "next/link";

export default function CertificatPage() {
  const [nom, setNom] = useState("");

  const telecharger = () => {
    const html = "<!DOCTYPE html><html><head><meta charset=\"utf-8\"><title>Certificat</title></head><body style=\"font-family:system-ui;text-align:center;padding:40px;border:3px solid #f59e0b;margin:20px\"><h1 style=\"font-size:36px;color:#f59e0b\">CERTIFICAT DE COMPLÉTION</h1><p style=\"font-size:18px;margin:30px 0\">Ce certificat atteste que</p><h2 style=\"font-size:28px\">" + (nom || "_________________") + "</h2><p style=\"font-size:18px;margin:30px 0\">a complété avec succès la formation</p><h3 style=\"font-size:24px\">Lancer un projet numérique avec l'IA</h3><p style=\"font-size:14px;color:#666;margin-top:40px\">5 modules • Quiz interactifs • Suivi de progression</p><p style=\"font-size:14px;color:#666\">Date : " + new Date().toLocaleDateString("fr-FR") + "</p></body></html>";
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "certificat-formation-ia.html";
    a.click();
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "20px", fontFamily: "system-ui", textAlign: "center" }}>
      <Link href="/formation" style={{ color: "#0070f3", fontSize: 14 }}>
        ← Retour à la formation
      </Link>
      <h1 style={{ fontSize: 28, margin: "20px 0" }}>Certificat de complétion</h1>
      <p style={{ color: "#666", marginBottom: 30 }}>
        Entrez votre nom pour générer votre certificat.
      </p>
      <input
        type="text"
        value={nom}
        onChange={e => setNom(e.target.value)}
        placeholder="Votre nom complet"
        style={{ padding: "12px 16px", fontSize: 16, width: "100%", maxWidth: 400, border: "1px solid #ddd", borderRadius: 6, marginBottom: 20 }}
      />
      <div>
        <button
          onClick={telecharger}
          disabled={!nom.trim()}
          style={{ padding: "14px 28px", background: nom.trim() ? "#f59e0b" : "#ccc", color: "white", border: "none", borderRadius: 6, fontSize: 16, fontWeight: "bold", cursor: nom.trim() ? "pointer" : "not-allowed" }}
        >
          Télécharger le certificat
        </button>
      </div>
    </div>
  );
}
