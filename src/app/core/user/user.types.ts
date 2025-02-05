export interface User
{
    id: number;
    firstName: string;
    lastName: string;
    matricule: string;
    role?: string;
    email: string;
    avatar?: string;
    status?: string;
    manager?: string;
    onLeave: boolean;
    soldeConge: number;
    managerMatricule?: string | null;
}
