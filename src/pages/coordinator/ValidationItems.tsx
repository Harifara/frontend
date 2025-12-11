// import React, { useEffect, useState } from "react";
// import { coordinateurApi } from "@/lib/api";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import { Button } from "@/components/ui/button";
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
// import { useToast } from "@/hooks/use-toast";

// interface ValidationItem {
//   id: string;
//   item_decaissement_id: string;
//   coordinateur_id: string;
//   statut: string;
//   commentaire?: string;
//   date_validation: string;
//   raw?: any;
// }

// const ValidationCoordinateurPage = () => {
//   const [items, setItems] = useState<ValidationItem[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
//   const [commentModalOpen, setCommentModalOpen] = useState(false);
//   const [rejectionComment, setRejectionComment] = useState("");
//   const [selectedItem, setSelectedItem] = useState<ValidationItem | null>(null);

//   const { toast } = useToast();

//   const fetchValidations = async () => {
//     setLoading(true);
//     try {
//       const res = await coordinateurApi.getValidations();
//       const data = Array.isArray(res?.data) ? res.data : res.results || [];
//       setItems(data);
//     } catch (err: any) {
//       toast({ title: "Erreur", description: err.message || "Impossible de charger les validations.", variant: "destructive" });
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchValidations();
//   }, []);

//   const handleApprove = async (item: ValidationItem) => {
//     setActionLoadingId(item.id);
//     try {
//       await coordinateurApi.approveItem(item.id);
//       toast({ title: "Succès", description: "Item validé." });
//       fetchValidations();
//     } catch (err: any) {
//       toast({ title: "Erreur", description: err.message || "Impossible de valider l'item.", variant: "destructive" });
//     } finally {
//       setActionLoadingId(null);
//     }
//   };

//   const handleReject = async () => {
//     if (!selectedItem) return;
//     setActionLoadingId(selectedItem.id);
//     try {
//       await coordinateurApi.rejectItem(selectedItem.id, rejectionComment);
//       toast({ title: "Succès", description: "Item rejeté." });
//       setCommentModalOpen(false);
//       setRejectionComment("");
//       setSelectedItem(null);
//       fetchValidations();
//     } catch (err: any) {
//       toast({ title: "Erreur", description: err.message || "Impossible de rejeter l'item.", variant: "destructive" });
//     } finally {
//       setActionLoadingId(null);
//     }
//   };

//   if (loading) return <p className="p-8 text-center">Chargement...</p>;

//   return (
//     <div className="p-8 space-y-6">
//       <h1 className="text-3xl font-bold">Validations Coordinateur</h1>

//       <Card>
//         <CardHeader>
//           <CardTitle>Liste des items à valider</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <Table>
//             <TableHeader>
//               <TableRow>
//                 <TableHead>ID Item</TableHead>
//                 <TableHead>Statut</TableHead>
//                 <TableHead>Commentaire</TableHead>
//                 <TableHead>Date</TableHead>
//                 <TableHead>Actions</TableHead>
//               </TableRow>
//             </TableHeader>
//             <TableBody>
//               {items.length ? items.map((i) => (
//                 <TableRow key={i.id}>
//                   <TableCell>{i.item_decaissement_id}</TableCell>
//                   <TableCell>{i.statut}</TableCell>
//                   <TableCell>{i.commentaire || "-"}</TableCell>
//                   <TableCell>{new Date(i.date_validation).toLocaleString()}</TableCell>
//                   <TableCell className="flex gap-2">
//                     <Button
//                       size="sm"
//                       variant="outline"
//                       onClick={() => handleApprove(i)}
//                       disabled={actionLoadingId === i.id}
//                     >
//                       {actionLoadingId === i.id ? "..." : "Valider"}
//                     </Button>
//                     <Button
//                       size="sm"
//                       variant="destructive"
//                       onClick={() => { setSelectedItem(i); setCommentModalOpen(true); }}
//                       disabled={actionLoadingId === i.id}
//                     >
//                       {actionLoadingId === i.id ? "..." : "Rejeter"}
//                     </Button>
//                   </TableCell>
//                 </TableRow>
//               )) : (
//                 <TableRow>
//                   <TableCell colSpan={5} className="text-center py-6">Aucun item à valider.</TableCell>
//                 </TableRow>
//               )}
//             </TableBody>
//           </Table>
//         </CardContent>
//       </Card>

//       {/* Modal Rejet avec commentaire */}
//       <Dialog open={commentModalOpen} onOpenChange={setCommentModalOpen}>
//         <DialogContent className="sm:max-w-[520px]">
//           <DialogHeader>
//             <DialogTitle>Rejet / Commentaire</DialogTitle>
//           </DialogHeader>
//           <div className="space-y-4">
//             <p className="text-sm">Indiquez un commentaire pour le rejet (optionnel).</p>
//             <Input
//               placeholder="Commentaire"
//               value={rejectionComment}
//               onChange={(e) => setRejectionComment(e.target.value)}
//             />
//           </div>
//           <DialogFooter className="mt-4 flex gap-2">
//             <Button onClick={() => { setCommentModalOpen(false); setRejectionComment(""); setSelectedItem(null); }} variant="outline">Annuler</Button>
//             <Button variant="destructive" onClick={handleReject} disabled={!selectedItem || actionLoadingId === selectedItem.id}>
//               {actionLoadingId === (selectedItem?.id ?? null) ? "..." : "Confirmer le rejet"}
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// };

// export default ValidationCoordinateurPage;
