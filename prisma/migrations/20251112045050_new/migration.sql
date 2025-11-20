-- CreateTable
CREATE TABLE "_ParticipantesGasto" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_ParticipantesGasto_A_fkey" FOREIGN KEY ("A") REFERENCES "Gasto" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ParticipantesGasto_B_fkey" FOREIGN KEY ("B") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "_ParticipantesGasto_AB_unique" ON "_ParticipantesGasto"("A", "B");

-- CreateIndex
CREATE INDEX "_ParticipantesGasto_B_index" ON "_ParticipantesGasto"("B");
