import { pb } from "../lib/pb";

export interface ListResult<T> {
    page: number;
    perPage: number;
    totalItems: number;
    totalPages: number;
    items: T[];
}

// Generic types for the user model based on PocketBase
export interface UserRecord {
    id: string;
    email: string;
    username: string;
    name: string;
    display_name: string;
    avatar: string;
    phone_number: string;
    total_coins: number;
    isAdmin: boolean;
    institution: string;
    created: string;
    updated: string;
}

export interface SoftwareRecord {
    id: string;
    name: string;
    category: string;
    logo: string;
    thumbnail: string;
    preview: string[];
    description: string;
    version: string;
    link: string;
    collectionId: string;
    collectionName: string;
    created: string;
    updated: string;
}

export interface BookingRecord {
    id: string;
    user_id: string;
    course_id: string;
    course_title: string;
    course_type: string;
    mentor_id: string;
    mentor_name: string;
    mentor_email: string;
    full_name: string;
    email: string;
    whatsapp: string;
    session_date: string;
    session_time: string;
    topic: string;
    duration: string;
    session_number: number;
    total_sessions: number;
    booking_group_id: string;
    price_per_session: number;
    discount_applied: boolean;
    discount_percentage: number;
    discount_amount: number;
    subtotal: number;
    tax_percentage: number;
    tax_amount: number;
    total_amount: number;
    external_id: string;
    payment_status: 'pending' | 'paid' | 'expired' | 'failed';
    booking_status: 'pending' | 'confirmed' | 'ongoing' | 'completed' | 'cancelled' | 'finished';
    invoice_id: string;
    payment_method: string;
    payment_date: string;
    created: string;
    updated: string;
}

export interface CashflowItemRecord {
    id: string;
    date: string;
    time: string;
    category: string;
    type: string;
    name: string;
    description: string;
    amount: number;
    notes: string;
    created: string;
    updated: string;
}

export interface CashflowNameRecord {
    id: string;
    name: string;
    created: string;
    updated: string;
}

export interface CashflowTagRecord {
    id: string;
    category: string;
    tag: string;
    created: string;
    updated: string;
}

export interface RequestedFileRecord {
    id: string;
    subject: string;
    description: string;
    upload_date: string;
    sender_id: string;
    recipient_id: string;
    created: string;
    updated: string;
}

export interface RequestedFileItemRecord {
    id: string;
    requested_file_id: string;
    original_filename: string;
    stored_filename: string;
    file: string;
    file_size: number;
    file_type: string;
    created: string;
    updated: string;
}

export interface PortfolioRecord {
    id: string;
    project: string;
    category: string;
    location: string;
    year: number;
    area: string;
    client: string;
    long_description: string;
    thumbnail: string;
    preview: string[];
    collectionId: string;
    collectionName: string;
    created: string;
    updated: string;
}

export interface ProductRecord {
    id: string;
    name: string;
    short_description: string;
    long_description: string;
    main_price: number;
    category: string;
    file_name: string;
    file_size: number;
    created_by: string;
    created_by_name: string;
    discount_price: number;
    features: any;
    pictures: string[];
    file_format: string;
    version: string;
    language: string;
    sub_category: string;
    is_active: boolean;
    view_count: number;
    download_count: number;
    thumbnail: string;
    file: string;
    collectionId: string;
    collectionName: string;
    created: string;
    updated: string;
}

export interface RevitFileRecord {
    id: string;
    uploaded_by: string;
    uploaded_by_name: string;
    file_name: string;
    display_name: string;
    category: string;
    revit_version: string;
    preview_image: string;
    file: string;
    file_size: number;
    download_count: number;
    collectionId: string;
    collectionName: string;
    created: string;
    updated: string;
}

export interface ResourceRecord {
    id: string;
    title: string;
    author: string;
    year_released: number;
    file_name: string;
    file: string;
    file_size: number;
    file_type: string;
    category: string;
    subcategory: string;
    uploaded_by: string;
    uploaded_by_name: string;
    is_active: boolean;
    download_count: number;
    collectionId: string;
    collectionName: string;
    created: string;
    updated: string;
}

export interface DaharPDFHistoryRecord {
    id: string;
    user: string;
    tool: string;
    expand?: {
        user: UserRecord;
    };
    created: string;
    updated: string;
}

export interface TerraSimFeedbackRecord {
    id: string;
    user: string;
    title: string;
    subject: string;
    description: string;
    version: string;
    date: string;
    images: string[];
    expand?: {
        user: UserRecord;
    };
    created: string;
    updated: string;
}

export interface TerraSimProjectRecord {
    id: string;
    user: string;
    name: string;
    version: string;
    // Omit data JSON to keep payloads small in overview
    expand?: {
        user: UserRecord;
    };
    created: string;
    updated: string;
}

export interface TerraSimRunningHistoryRecord {
    id: string;
    version: string;
    user_id: string;
    expand?: {
        user_id: UserRecord;
    };
    created: string;
    updated: string;
}

export interface PaymentHistoryRecord {
    id: string;
    user_id: string;
    old_user_id: string;
    product_id: string;
    product_name: string;
    product_category: string;
    amount: number;
    discount_amount: number;
    final_amount: number;
    external_id: string;
    invoice_id: string;
    payment_status: string;
    payment_method: string;
    payment_date: string;
    file_path: string;
    file_name: string;
    file_size: number;
    downloaded: boolean;
    download_date: string;
    user_email: string;
    user_name: string;
    expand?: {
        user_id: UserRecord;
    };
    created: string;
    updated: string;
}

export const UserService = {
    /**
     * Fetch paginated users from the PocketBase collection
     */
    async getUsers(page = 1, perPage = 10, sort = "-created"): Promise<ListResult<UserRecord>> {
        try {
            const result = await pb.collection("users").getList<UserRecord>(page, perPage, {
                sort: sort,
            });
            return result;
        } catch (error) {
            console.error("UserService: Error fetching users:", error);
            throw error;
        }
    },

    /**
     * Update a user record in the PocketBase collection
     */
    async updateUser(id: string, data: Partial<UserRecord>): Promise<UserRecord> {
        try {
            const record = await pb.collection("users").update<UserRecord>(id, data);
            return record;
        } catch (error) {
            console.error(`UserService: Error updating user ${id}:`, error);
            throw error;
        }
    },

    /**
     * Update the currently authenticated user's profile
     */
    async updateProfile(data: Partial<UserRecord>): Promise<UserRecord> {
        try {
            if (!pb.authStore.model?.id) throw new Error("No authenticated user");
            const record = await pb.collection("users").update<UserRecord>(pb.authStore.model.id, data);
            // Updating local authStore
            pb.authStore.save(pb.authStore.token, record as any);
            return record;
        } catch (error) {
            console.error("UserService: Error updating profile:", error);
            throw error;
        }
    },

    /**
     * Update the currently authenticated user's password
     */
    async updatePassword(data: { oldPassword: string; password: string; passwordConfirm: string }): Promise<void> {
        try {
            if (!pb.authStore.model?.id) throw new Error("No authenticated user");
            await pb.collection("users").update(pb.authStore.model.id, data);
        } catch (error) {
            console.error("UserService: Error updating password:", error);
            throw error;
        }
    },

    /**
     * Helper to get the absolute URL for a user's avatar
     */
    getAvatarUrl(user: UserRecord, thumb = '100x100'): string | null {
        if (!user.avatar) return null;
        return pb.files.getUrl(user, user.avatar, { thumb });
    },

    /**
     * Helper to determine the best display name to show for a user
     */
    getDisplayName(user: UserRecord): string {
        return user.display_name || user.name || "Unknown";
    }
};

export const SoftwareService = {
    /**
     * Fetch paginated software from the PocketBase collection
     */
    async getSoftwares(page = 1, perPage = 10, sort = "-created"): Promise<ListResult<SoftwareRecord>> {
        try {
            const result = await pb.collection("softwares").getList<SoftwareRecord>(page, perPage, {
                sort: sort,
            });
            return result;
        } catch (error) {
            console.error("SoftwareService: Error fetching softwares:", error);
            throw error;
        }
    },

    /**
     * Create a new software record
     */
    async createSoftware(data: FormData): Promise<SoftwareRecord> {
        try {
            const record = await pb.collection("softwares").create<SoftwareRecord>(data);
            return record;
        } catch (error) {
            console.error("SoftwareService: Error creating software:", error);
            throw error;
        }
    },

    /**
     * Update a software record
     */
    async updateSoftware(id: string, data: FormData | Partial<SoftwareRecord>): Promise<SoftwareRecord> {
        try {
            const record = await pb.collection("softwares").update<SoftwareRecord>(id, data);
            return record;
        } catch (error) {
            console.error(`SoftwareService: Error updating software ${id}:`, error);
            throw error;
        }
    },

    /**
     * Delete a software record
     */
    async deleteSoftware(id: string): Promise<boolean> {
        try {
            await pb.collection("softwares").delete(id);
            return true;
        } catch (error) {
            console.error(`SoftwareService: Error deleting software ${id}:`, error);
            throw error;
        }
    },

    /**
     * Helper to get the absolute URL for a software's file (logo, thumbnail, preview)
     */
    getFileUrl(record: SoftwareRecord, filename: string, thumb = ''): string | null {
        if (!filename) return null;
        return pb.files.getUrl(record, filename, thumb ? { thumb } : {});
    }
};

export const CourseService = {
    async getBookings(page = 1, perPage = 10, sort = "-created"): Promise<ListResult<BookingRecord>> {
        try {
            return await pb.collection("bookings").getList<BookingRecord>(page, perPage, { sort });
        } catch (error) {
            console.error("CourseService: Error fetching bookings:", error);
            throw error;
        }
    },

    async updateBooking(id: string, data: Partial<BookingRecord>): Promise<BookingRecord> {
        try {
            const record = await pb.collection("bookings").update<BookingRecord>(id, data);
            return record;
        } catch (error) {
            console.error(`CourseService: Error updating booking ${id}:`, error);
            throw error;
        }
    }
};

export const CashflowService = {
    async getItems(page = 1, perPage = 25, sort = "-date", filter = ""): Promise<ListResult<CashflowItemRecord>> {
        try {
            return await pb.collection("cashflow_items").getList<CashflowItemRecord>(page, perPage, { sort, filter });
        } catch (error) {
            console.error("CashflowService: Error fetching items:", error);
            throw error;
        }
    },

    async updateItem(id: string, data: Partial<CashflowItemRecord>): Promise<CashflowItemRecord> {
        try {
            return await pb.collection("cashflow_items").update<CashflowItemRecord>(id, data);
        } catch (error) {
            console.error("CashflowService: Error updating item:", error);
            throw error;
        }
    },

    async deleteItem(id: string): Promise<boolean> {
        try {
            await pb.collection("cashflow_items").delete(id);
            return true;
        } catch (error) {
            console.error("CashflowService: Error deleting item:", error);
            throw error;
        }
    },

    async createItem(data: Partial<CashflowItemRecord>): Promise<CashflowItemRecord> {
        try {
            return await pb.collection("cashflow_items").create<CashflowItemRecord>(data);
        } catch (error) {
            console.error("CashflowService: Error creating item:", error);
            throw error;
        }
    },

    async getNames(): Promise<CashflowNameRecord[]> {
        try {
            return await pb.collection("cashflow_names").getFullList<CashflowNameRecord>({ sort: "name" });
        } catch (error) {
            console.error("CashflowService: Error fetching names:", error);
            return [];
        }
    },

    async createName(name: string): Promise<CashflowNameRecord> {
        try {
            return await pb.collection("cashflow_names").create<CashflowNameRecord>({ name });
        } catch (error) {
            console.error("CashflowService: Error creating name:", error);
            throw error;
        }
    },

    async getTags(): Promise<CashflowTagRecord[]> {
        try {
            return await pb.collection("cashflow_tags").getFullList<CashflowTagRecord>({ sort: "tag" });
        } catch (error) {
            console.error("CashflowService: Error fetching tags:", error);
            return [];
        }
    },

    async createTag(data: { category: string, tag: string }): Promise<CashflowTagRecord> {
        try {
            return await pb.collection("cashflow_tags").create<CashflowTagRecord>(data);
        } catch (error) {
            console.error("CashflowService: Error creating tag:", error);
            throw error;
        }
    },

    async getStats(filter = ""): Promise<{ income: number, expense: number, balance: number }> {
        try {
            // Ensure filter is either a non-empty string or undefined
            const options = filter ? { filter } : {};
            const items = await pb.collection("cashflow_items").getFullList<CashflowItemRecord>(options);

            console.log(`CashflowService: getStats - items found: ${items.length} with filter: "${filter || 'none'}"`);

            let income = 0;
            let expense = 0;

            items.forEach(i => {
                const typeVal = (i.type || "").toLowerCase().trim();
                const catVal = (i.category || "").toLowerCase().trim();
                const amount = parseFloat(String(i.amount)) || 0;

                const isIncome = typeVal === 'income' || typeVal === 'in' || typeVal === 'masuk' ||
                    catVal === 'income' || catVal === 'in' || catVal === 'masuk';

                const isExpense = typeVal === 'expense' || typeVal === 'out' || typeVal === 'keluar' ||
                    catVal === 'expense' || catVal === 'out' || catVal === 'keluar';

                if (isIncome) {
                    income += amount;
                } else if (isExpense) {
                    expense += amount;
                }
            });

            console.log(`CashflowService: getStats results - Income: ${income}, Expense: ${expense}`);

            return {
                income,
                expense,
                balance: income - expense
            };
        } catch (error) {
            console.error("CashflowService: Error calculating stats:", error);
            return { income: 0, expense: 0, balance: 0 };
        }
    }
};

export const FileService = {
    async getRequestedFiles(page = 1, perPage = 10, sort = "-created"): Promise<ListResult<RequestedFileRecord>> {
        try {
            return await pb.collection("requested_files").getList<RequestedFileRecord>(page, perPage, { sort });
        } catch (error) {
            console.error("FileService: Error fetching requested files:", error);
            throw error;
        }
    },

    async getFileItems(requestedFileId: string): Promise<RequestedFileItemRecord[]> {
        try {
            return await pb.collection("requested_file_items").getFullList<RequestedFileItemRecord>({
                filter: `requested_file_id = "${requestedFileId}"`,
            });
        } catch (error) {
            console.error("FileService: Error fetching file items:", error);
            throw error;
        }
    },

    async createRequestWithFiles(
        requestData: Partial<RequestedFileRecord>,
        files: File[]
    ): Promise<RequestedFileRecord> {
        try {
            // 1. Create the parent record
            const request = await pb.collection("requested_files").create<RequestedFileRecord>({
                ...requestData,
                upload_date: new Date().toISOString(),
            });

            // 2. Upload each file as an item
            for (const file of files) {
                const formData = new FormData();
                formData.append('requested_file_id', request.id);
                formData.append('original_filename', file.name);
                formData.append('file', file);
                formData.append('file_size', file.size.toString());
                formData.append('file_type', file.type);

                await pb.collection("requested_file_items").create(formData);
            }

            return request;
        } catch (error) {
            console.error("FileService: Error creating request with files:", error);
            throw error;
        }
    },

    async deleteRequest(id: string): Promise<boolean> {
        try {
            await pb.collection("requested_files").delete(id);
            return true;
        } catch (error) {
            console.error(`FileService: Error deleting request ${id}:`, error);
            throw error;
        }
    },

    getFileUrl(record: RequestedFileItemRecord, filename: string): string {
        return pb.files.getUrl(record, filename);
    }
};

export const PortfolioService = {
    async getPortfolio(page = 1, perPage = 10, sort = "-created", filter = ""): Promise<ListResult<PortfolioRecord>> {
        try {
            const result = await pb.collection("portfolio").getList<PortfolioRecord>(page, perPage, {
                sort,
                filter,
            });
            return {
                page: result.page,
                perPage: result.perPage,
                totalItems: result.totalItems,
                totalPages: result.totalPages,
                items: result.items,
            };
        } catch (error) {
            console.error("PortfolioService: Error fetching portfolio:", error);
            throw error;
        }
    },

    async createPortfolio(data: FormData): Promise<PortfolioRecord> {
        try {
            return await pb.collection("portfolio").create<PortfolioRecord>(data);
        } catch (error) {
            console.error("PortfolioService: Error creating portfolio:", error);
            throw error;
        }
    },

    async updatePortfolio(id: string, data: FormData | Partial<PortfolioRecord>): Promise<PortfolioRecord> {
        try {
            return await pb.collection("portfolio").update<PortfolioRecord>(id, data);
        } catch (error) {
            console.error(`PortfolioService: Error updating portfolio ${id}:`, error);
            throw error;
        }
    },

    async deletePortfolio(id: string): Promise<boolean> {
        try {
            await pb.collection("portfolio").delete(id);
            return true;
        } catch (error) {
            console.error(`PortfolioService: Error deleting portfolio ${id}:`, error);
            throw error;
        }
    },

    getFileUrl(record: PortfolioRecord, filename: string, thumb = ""): string {
        return pb.files.getUrl(record, filename, { thumb });
    }
};

export const ProductService = {
    async getProducts(page = 1, perPage = 10, sort = "-created", filter = ""): Promise<ListResult<ProductRecord>> {
        try {
            const result = await pb.collection("products").getList<ProductRecord>(page, perPage, {
                sort,
                filter,
            });
            return result;
        } catch (error) {
            console.error("ProductService: Error fetching products:", error);
            throw error;
        }
    },

    async createProduct(data: FormData): Promise<ProductRecord> {
        try {
            return await pb.collection("products").create<ProductRecord>(data);
        } catch (error) {
            console.error("ProductService: Error creating product:", error);
            throw error;
        }
    },

    async updateProduct(id: string, data: FormData | Partial<ProductRecord>): Promise<ProductRecord> {
        try {
            return await pb.collection("products").update<ProductRecord>(id, data);
        } catch (error) {
            console.error(`ProductService: Error updating product ${id}:`, error);
            throw error;
        }
    },

    async deleteProduct(id: string): Promise<boolean> {
        try {
            await pb.collection("products").delete(id);
            return true;
        } catch (error) {
            console.error(`ProductService: Error deleting product ${id}:`, error);
            throw error;
        }
    },

    getFileUrl(record: ProductRecord, filename: string, thumb = ""): string {
        return pb.files.getUrl(record, filename, { thumb });
    }
};

export const RevitFileService = {
    async getRevitFiles(page = 1, perPage = 15, sort = "-created", filter = ""): Promise<ListResult<RevitFileRecord>> {
        try {
            const result = await pb.collection("revit_files").getList<RevitFileRecord>(page, perPage, {
                sort,
                filter,
            });
            return result;
        } catch (error) {
            console.error("RevitFileService: Error fetching revit files:", error);
            throw error;
        }
    },

    async createRevitFile(data: FormData): Promise<RevitFileRecord> {
        try {
            return await pb.collection("revit_files").create<RevitFileRecord>(data);
        } catch (error) {
            console.error("RevitFileService: Error creating revit file:", error);
            throw error;
        }
    },

    async updateRevitFile(id: string, data: FormData | Partial<RevitFileRecord>): Promise<RevitFileRecord> {
        try {
            return await pb.collection("revit_files").update<RevitFileRecord>(id, data);
        } catch (error) {
            console.error(`RevitFileService: Error updating revit file ${id}:`, error);
            throw error;
        }
    },

    async deleteRevitFile(id: string): Promise<boolean> {
        try {
            await pb.collection("revit_files").delete(id);
            return true;
        } catch (error) {
            console.error(`RevitFileService: Error deleting revit file ${id}:`, error);
            throw error;
        }
    },

    getFileUrl(record: RevitFileRecord, filename: string, thumb = ""): string {
        return pb.files.getUrl(record, filename, { thumb });
    }
};

export const ResourceService = {
    async getResources(page = 1, perPage = 15, sort = "-created", filter = ""): Promise<ListResult<ResourceRecord>> {
        try {
            const result = await pb.collection("resources").getList<ResourceRecord>(page, perPage, {
                sort,
                filter,
            });
            return result;
        } catch (error) {
            console.error("ResourceService: Error fetching resources:", error);
            throw error;
        }
    },

    async createResource(data: FormData): Promise<ResourceRecord> {
        try {
            return await pb.collection("resources").create<ResourceRecord>(data);
        } catch (error) {
            console.error("ResourceService: Error creating resource:", error);
            throw error;
        }
    },

    async updateResource(id: string, data: FormData | Partial<ResourceRecord>): Promise<ResourceRecord> {
        try {
            return await pb.collection("resources").update<ResourceRecord>(id, data);
        } catch (error) {
            console.error(`ResourceService: Error updating resource ${id}:`, error);
            throw error;
        }
    },

    async deleteResource(id: string): Promise<boolean> {
        try {
            await pb.collection("resources").delete(id);
            return true;
        } catch (error) {
            console.error(`ResourceService: Error deleting resource ${id}:`, error);
            throw error;
        }
    },

    getFileUrl(record: ResourceRecord, filename: string, thumb = ""): string {
        return pb.files.getUrl(record, filename, { thumb });
    }
};

export const DaharPDFService = {
    async getHistory(page = 1, perPage = 50, sort = "-created", filter = ""): Promise<ListResult<DaharPDFHistoryRecord>> {
        try {
            const result = await pb.collection("daharpdf_history").getList<DaharPDFHistoryRecord>(page, perPage, {
                sort,
                filter,
                expand: "user",
            });
            return result;
        } catch (error) {
            console.error("DaharPDFService: Error fetching history:", error);
            throw error;
        }
    },

    async getAllHistory(): Promise<DaharPDFHistoryRecord[]> {
        try {
            const result = await pb.collection("daharpdf_history").getFullList<DaharPDFHistoryRecord>({
                sort: "-created",
                expand: "user",
            });
            return result;
        } catch (error) {
            console.error("DaharPDFService: Error fetching full history:", error);
            throw error;
        }
    }
};

export const TerraSimService = {
    async getFeedback(page = 1, perPage = 50, sort = "-created"): Promise<ListResult<TerraSimFeedbackRecord>> {
        try {
            return await pb.collection("terrasim_feedback").getList<TerraSimFeedbackRecord>(page, perPage, {
                sort,
                expand: "user",
            });
        } catch (error) {
            console.error("TerraSimService: Error fetching feedback:", error);
            throw error;
        }
    },

    async getProjects(page = 1, perPage = 200, sort = "-created"): Promise<ListResult<TerraSimProjectRecord>> {
        try {
            // Specifically exclude the large 'data' JSON field using fields param if necessary,
            // or just rely on the interface to ignore it on the frontend.
            return await pb.collection("terrasim_projects").getList<TerraSimProjectRecord>(page, perPage, {
                sort,
                expand: "user",
                fields: "id,user,name,version,created,updated,expand.user"
            });
        } catch (error) {
            console.error("TerraSimService: Error fetching projects:", error);
            throw error;
        }
    },

    async getRunningHistory(page = 1, perPage = 500, sort = "+created"): Promise<ListResult<TerraSimRunningHistoryRecord>> {
        try {
            return await pb.collection("terrasim_running_history").getList<TerraSimRunningHistoryRecord>(page, perPage, {
                sort,
                expand: "user_id"
            });
        } catch (error) {
            console.error("TerraSimService: Error fetching running history:", error);
            throw error;
        }
    },

    getFeedbackImageUrl(record: TerraSimFeedbackRecord, fileName: string): string {
        return pb.files.getUrl(record, fileName);
    }
};

export const ProductPaymentService = {
    async getPayments(page = 1, perPage = 50, sort = "-payment_date", filter = ""): Promise<ListResult<PaymentHistoryRecord>> {
        try {
            return await pb.collection("payment_history").getList<PaymentHistoryRecord>(page, perPage, {
                sort,
                filter,
                expand: "user_id",
            });
        } catch (error) {
            console.error("ProductPaymentService: Error fetching payments:", error);
            throw error;
        }
    },

    async getAllPayments(): Promise<PaymentHistoryRecord[]> {
        try {
            return await pb.collection("payment_history").getFullList<PaymentHistoryRecord>({
                sort: "-payment_date",
                expand: "user_id",
            });
        } catch (error) {
            console.error("ProductPaymentService: Error fetching full history:", error);
            throw error;
        }
    }
};
