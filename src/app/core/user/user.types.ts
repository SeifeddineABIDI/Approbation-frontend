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
    manager?:{ matricule: string };
    onLeave: boolean;
    soldeConge: number;
    managerMatricule?: string | null;
}
