// --------------------
// Composant DemandesReapproPage
// --------------------
export default function DemandesReapproPage() {
  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false); // création demande
  const [showDialog, setShowDialog] = useState(false); // rejet
  const [showStockModal, setShowStockModal] = useState(false); // vérification stock

  const [selectedDemande, setSelectedDemande] = useState<Demande | null>(null);
  const [commentaire, setCommentaire] = useState("");

  const [magasins, setMagasins] = useState<{ id: string; nom: string }[]>([]);
  const [articles, setArticles] = useState<{ id: string; nom: string }[]>([]);
  const [magasinId, setMagasinId] = useState("");
  const [articleId, setArticleId] = useState("");
  const [quantite, setQuantite] = useState(1);
  const [priorite, setPriorite] = useState("normale");
  const [motif, setMotif] = useState("");

  const [stocksAutresMagasins, setStocksAutresMagasins] = useState<
    { magasin: string; quantite: number }[]
  >([]);

  const priorites = ["faible", "normale", "haute", "urgente"];

  // --------------------
  // Récupération données
  // --------------------
  const fetchDemandes = async () => {
    try {
      setLoading(true);
      const res = await stockApi.getDemandes(); 
      setDemandes(res);
    } catch (error) {
      console.error("Erreur récupération demandes :", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMagasinsArticles = async () => {
    try {
      const mags = await stockApi.getMagasins();
      setMagasins(mags);

      const arts = await stockApi.getArticles();
      setArticles(arts);
    } catch (error) {
      console.error("Erreur récupération magasins/articles :", error);
    }
  };

  useEffect(() => {
    fetchDemandes();
    fetchMagasinsArticles();
  }, []);

  // --------------------
  // Validation / Rejet
  // --------------------
  const handleValider = async (demande: Demande) => {
    try {
      await stockApi.validerDemande(demande.id);
      fetchDemandes();
    } catch (error) {
      console.error("Erreur validation demande :", error);
    }
  };

  const handleRejeter = (demande: Demande) => {
    setSelectedDemande(demande);
    setShowDialog(true);
  };

  const submitRejet = async () => {
    if (!selectedDemande) return;

    try {
      await stockApi.rejeterDemande(selectedDemande.id, { commentaire_validation: commentaire });
      setShowDialog(false);
      setCommentaire("");
      setSelectedDemande(null);
      fetchDemandes();
    } catch (error) {
      console.error("Erreur rejet demande :", error);
    }
  };

  // --------------------
  // Création demande
  // --------------------
  const handleCreateDemande = async () => {
    if (!magasinId || !articleId || !quantite || !motif) {
      alert("Veuillez remplir tous les champs !");
      return;
    }

    try {
      await stockApi.createDemande({
        magasin_id: magasinId,
        article_id: articleId,
        quantite_demandee: quantite,
        priorite,
        motif,
      });

      setShowModal(false);
      setMagasinId("");
      setArticleId("");
      setQuantite(1);
      setPriorite("normale");
      setMotif("");

      fetchDemandes();
    } catch (error: any) {
      console.error("Erreur création demande :", error);
      alert(`Erreur : ${error.message || error}`);
    }
  };

  // --------------------
  // Vérification stock autres magasins
  // --------------------
  const handleVerifierStock = async (demande: Demande) => {
    setSelectedDemande(demande);
    try {
      const res = await stockApi.getStocksAutresMagasins(demande.article?.id || "");
      setStocksAutresMagasins(res);
      setShowStockModal(true);
    } catch (error) {
      console.error("Erreur vérification stock :", error);
    }
  };

  const handleCreerTransfert = async (magasinSourceId: string) => {
    if (!selectedDemande) return;

    try {
      await stockApi.createTransfert({
        demande_id: selectedDemande.id,
        magasin_source_id: magasinSourceId,
        quantite: selectedDemande.quantite_demandee,
      });
      setShowStockModal(false);
      setSelectedDemande(null);
      fetchDemandes();
    } catch (error) {
      console.error("Erreur création transfert :", error);
    }
  };

  const handleDemandeAchat = async () => {
    if (!selectedDemande) return;

    try {
      await stockApi.createDemandeAchat({
        demande_id: selectedDemande.id,
        quantite: selectedDemande.quantite_demandee,
      });
      setShowStockModal(false);
      setSelectedDemande(null);
      fetchDemandes();
    } catch (error) {
      console.error("Erreur demande achat :", error);
    }
  };

  // --------------------
  // Rendu
  // --------------------
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Demandes de Réapprovisionnement</h1>
        <Button onClick={() => setShowModal(true)}>Nouvelle Demande</Button>
      </div>

      {loading ? (
        <p>Chargement...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell>Numéro</TableCell>
              <TableCell>Magasin</TableCell>
              <TableCell>Article</TableCell>
              <TableCell>Quantité demandée</TableCell>
              <TableCell>Quantité approuvée</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Priorité</TableCell>
              <TableCell>Motif</TableCell>
              <TableCell>Commentaire</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {demandes.map((d) => (
              <TableRow key={d.id}>
                <TableCell>{d.numero}</TableCell>
                <TableCell>{d.magasin?.nom || "-"}</TableCell>
                <TableCell>{d.article?.nom || "-"}</TableCell>
                <TableCell>{d.quantite_demandee}</TableCell>
                <TableCell>{d.quantite_approuvee || "-"}</TableCell>
                <TableCell>{d.statut}</TableCell>
                <TableCell>{d.priorite}</TableCell>
                <TableCell>{d.motif}</TableCell>
                <TableCell>{d.commentaire_validation || "-"}</TableCell>
                <TableCell className="space-x-2">
                  {d.statut === "en_attente" && (
                    <>
                      <Button onClick={() => handleVerifierStock(d)}>Vérifier Stock</Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Modal création demande */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle Demande</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Select value={magasinId} onValueChange={setMagasinId}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir un magasin" />
              </SelectTrigger>
              <SelectContent>
                {magasins.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.nom}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={articleId} onValueChange={setArticleId}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir un article" />
              </SelectTrigger>
              <SelectContent>
                {articles.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.nom}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input type="number" min={1} value={quantite} onChange={(e) => setQuantite(Number(e.target.value))} placeholder="Quantité demandée" />

            <Select value={priorite} onValueChange={setPriorite}>
              <SelectTrigger>
                <SelectValue placeholder="Priorité" />
              </SelectTrigger>
              <SelectContent>
                {priorites.map((p) => (
                  <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input type="text" value={motif} onChange={(e) => setMotif(e.target.value)} placeholder="Motif" />
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowModal(false)}>Annuler</Button>
            <Button onClick={handleCreateDemande}>Créer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal rejet */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeter la demande</DialogTitle>
          </DialogHeader>
          <Input placeholder="Commentaire de rejet" value={commentaire} onChange={(e) => setCommentaire(e.target.value)} />
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowDialog(false)}>Annuler</Button>
            <Button variant="destructive" onClick={submitRejet}>Rejeter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Vérifier stock */}
      <Dialog open={showStockModal} onOpenChange={setShowStockModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vérifier stock autres magasins</DialogTitle>
          </DialogHeader>

          {stocksAutresMagasins.length ? (
            <div className="space-y-2">
              {stocksAutresMagasins.map((s) => (
                <div key={s.magasin} className="flex justify-between items-center">
                  <span>{s.magasin} : {s.quantite} unités disponibles</span>
                  <Button onClick={() => handleCreerTransfert(s.magasin)}>Créer Transfert</Button>
                </div>
              ))}
            </div>
          ) : (
            <div>
              <p>Stock non disponible dans les autres magasins.</p>
              <Button onClick={handleDemandeAchat}>Envoyer Demande Achat</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
