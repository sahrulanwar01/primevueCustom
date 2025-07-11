<template>
    <div class="profile-page">
        <div class="grid">
            <div class="col-12">
                <!-- Profile Header -->
                <div class="profile-header">
                    <div class="flex flex-column md:flex-row align-items-center gap-4">
                        <div class="profile-avatar-container">
                            <img :src="profile.photo" :alt="profile.name" class="profile-avatar" @error="handleAvatarError" />
                            <button class="avatar-edit-btn p-button-rounded p-button-text" @click="showAvatarDialog = true" v-tooltip.top="'Change Profile Picture'">
                                <i class="pi pi-camera"></i>
                            </button>
                        </div>
                        <div class="profile-info">
                            <h2>{{ profile.name }}</h2>
                            <p>{{ profile.email }}</p>
                            <p>{{ role.name }} • {{ profile.status }}</p>
                            <div class="profile-actions">
                                <Button v-if="!editMode" label="Edit Profile" icon="pi pi-pencil" @click="startEdit" class="p-button-outlined p-button-light" />
                                <Button v-if="editMode" label="Save Changes" icon="pi pi-check" @click="saveProfile" class="p-button-success" />
                                <Button v-if="editMode" label="Cancel" icon="pi pi-times" @click="cancelEdit" class="p-button-secondary p-button-outlined" />
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Profile Content -->
                <div class="profile-content">
                    <div class="grid">
                        <!-- Main Content -->
                        <div class="col-12 lg:col-8">
                            <!-- Personal Information -->
                            <div class="profile-card">
                                <h6>
                                    <i class="pi pi-user"></i>
                                    Personal Information
                                </h6>
                                <div class="grid">
                                    <div class="col-12">
                                        <div class="field">
                                            <label for="userCode">User Code</label>
                                            <InputText id="userCode" v-model="profile.user_code" :disabled="true" placeholder="User Code" />
                                        </div>
                                    </div>
                                    <div class="col-12 md:col-6">
                                        <div class="field">
                                            <label for="name">Full Name</label>
                                            <InputText id="name" v-model="profile.name" :disabled="!editMode" placeholder="Enter your full name" />
                                        </div>
                                    </div>
                                    <div class="col-12 md:col-6">
                                        <div class="field">
                                            <label for="email">Email Address</label>
                                            <InputText id="email" v-model="profile.email" :disabled="!editMode" placeholder="Enter your email" type="email" />
                                        </div>
                                    </div>
                                    <div class="col-12 md:col-6">
                                        <div class="field">
                                            <label for="phone">Phone Number</label>
                                            <InputText id="phone" v-model="profile.phone" :disabled="!editMode" placeholder="Enter your phone number" />
                                        </div>
                                    </div>
                                    <div class="col-12 md:col-6">
                                        <div class="field">
                                            <label for="status">Status</label>
                                            <Dropdown id="status" v-model="profile.status" :options="statusOptions" :disabled="!editMode" placeholder="Select status" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Security Settings -->
                            <div class="profile-card">
                                <h6>
                                    <i class="pi pi-shield"></i>
                                    Security Settings
                                </h6>
                                <div class="grid">
                                    <div class="col-12 md:col-6">
                                        <div class="field">
                                            <label for="currentPassword">Current Password</label>
                                            <Password id="currentPassword" v-model="security.currentPassword" :feedback="false" toggleMask placeholder="Enter current password" />
                                        </div>
                                    </div>
                                    <div class="col-12 md:col-6">
                                        <div class="field">
                                            <label for="newPassword">New Password</label>
                                            <Password id="newPassword" v-model="security.newPassword" toggleMask placeholder="Enter new password" />
                                        </div>
                                    </div>
                                </div>
                                <div class="grid">
                                    <div class="col-12">
                                        <Button label="Change Password" icon="pi pi-lock" @click="changePassword" class="p-button-outlined" :loading="changingPassword" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Avatar Upload Dialog -->
        <Dialog v-model:visible="showAvatarDialog" header="Change Profile Picture" :style="{ width: '450px' }" :modal="true" class="avatar-dialog">
            <div class="dialog-content">
                <img :src="profile.photo" :alt="profile.name" class="avatar-preview" />
                <FileUpload mode="basic" name="photo" accept="image/*" :maxFileSize="2000000" chooseLabel="Choose Image" @select="onAvatarSelect" class="w-full" />
                <small class="text-500 block mt-2"> Maximum file size: 2MB. Supported formats: JPG, PNG, GIF </small>
            </div>
            <template #footer>
                <Button label="Cancel" icon="pi pi-times" @click="showAvatarDialog = false" class="p-button-text" />
                <Button label="Upload" icon="pi pi-check" @click="uploadAvatar" :loading="uploadingAvatar" />
            </template>
        </Dialog>
    </div>
</template>

<script setup>
import { useToast } from 'primevue/usetoast';
import { onMounted, reactive, ref } from 'vue';

const toast = useToast();

// Profile data based on API response
const profile = reactive({
    user_code: '',
    name: '',
    password: '',
    phone: '',
    photo: '',
    email: '',
    status: ''
});

// Role data
const role = reactive({
    role_code: '',
    name: ''
});

// Status options for dropdown
const statusOptions = ref(['ACTIVE', 'INACTIVE', 'SUSPENDED']);

// Security data
const security = reactive({
    currentPassword: '',
    newPassword: ''
});

// Preferences
const preferences = reactive({
    emailNotifications: true,
    pushNotifications: false,
    twoFactorAuth: true
});

// Stats
const stats = reactive({
    loginCount: 24,
    projectsCount: 8,
    tasksCount: 156
});

// Recent activities
const recentActivities = ref([
    {
        id: 1,
        title: 'Profile Updated',
        description: 'You updated your profile information',
        time: '2 hours ago',
        icon: 'pi pi-user'
    },
    {
        id: 2,
        title: 'Password Changed',
        description: 'Your password was successfully changed',
        time: '1 day ago',
        icon: 'pi pi-lock'
    },
    {
        id: 3,
        title: 'Login from New Device',
        description: 'New login detected from Chrome on Windows',
        time: '3 days ago',
        icon: 'pi pi-desktop'
    }
]);

// UI state
const editMode = ref(false);
const showAvatarDialog = ref(false);
const changingPassword = ref(false);
const uploadingAvatar = ref(false);
const originalProfile = ref(null);

// Methods
const handleAvatarError = (event) => {
    event.target.src = 'https://via.placeholder.com/150x150/6B7280/FFFFFF?text=U';
};

// Load profile data from API
const loadProfileData = () => {
    // Simulate API call - replace with actual API call
    const mockApiResponse = {
        statusCode: 200,
        message: 'User profile with permissions retrieved successfully',
        data: {
            user: {
                user_code: 'UC-001',
                name: 'Super Admin',
                password: '$2b$10$BeErVl2fGZzl.rmjBGalFeNjOLbBIMVav.5fE/dN3wXw2f/LxsJ9G',
                phone: '08931273918263',
                photo: '/storage/profileUser/1748833332325-642459411.png',
                email: 'superadmin@gmail.com',
                status: 'ACTIVE'
            },
            role: {
                role_code: 'RC-001',
                name: 'Super Admin'
            }
        }
    };

    // Update profile data
    Object.assign(profile, mockApiResponse.data.user);
    Object.assign(role, mockApiResponse.data.role);
};

const startEdit = () => {
    originalProfile.value = { ...profile };
    editMode.value = true;
};

const saveProfile = () => {
    // Simulate API call
    setTimeout(() => {
        editMode.value = false;
        originalProfile.value = null;
        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Profile updated successfully',
            life: 3000
        });
    }, 1000);
};

const cancelEdit = () => {
    editMode.value = false;
    if (originalProfile.value) {
        Object.assign(profile, originalProfile.value);
    }
    originalProfile.value = null;
};

const changePassword = () => {
    if (!security.currentPassword || !security.newPassword) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Please fill in all password fields',
            life: 3000
        });
        return;
    }

    changingPassword.value = true;

    // Simulate API call
    setTimeout(() => {
        security.currentPassword = '';
        security.newPassword = '';
        changingPassword.value = false;
        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Password changed successfully',
            life: 3000
        });
    }, 1500);
};

const onAvatarSelect = (event) => {
    const file = event.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            profile.photo = e.target.result;
        };
        reader.readAsDataURL(file);
    }
};

const uploadAvatar = () => {
    uploadingAvatar.value = true;

    // Simulate upload
    setTimeout(() => {
        showAvatarDialog.value = false;
        uploadingAvatar.value = false;
        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Profile picture updated successfully',
            life: 3000
        });
    }, 1500);
};

// Load profile data on component mount
onMounted(() => {
    loadProfileData();
});
</script>

<style scoped>
.profile-header {
    border-bottom: 1px solid var(--surface-border);
    padding-bottom: 2rem;
}

.profile-avatar-container {
    position: relative;
    display: inline-block;
}

.profile-avatar {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    object-fit: cover;
    border: 4px solid var(--surface-border);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.avatar-edit-btn {
    position: absolute;
    bottom: 0;
    right: 0;
    background: var(--primary-color);
    color: var(--primary-contrast-color);
    border: 3px solid var(--surface-card);
    width: 40px;
    height: 40px;
}

.avatar-edit-btn:hover {
    background: var(--primary-600);
}

.profile-info h2 {
    color: var(--text-color);
}

.field label {
    color: var(--text-color);
    margin-bottom: 0.5rem;
    display: block;
}

.card {
    background: var(--surface-card);
    border: 1px solid var(--surface-border);
    border-radius: var(--content-border-radius);
    padding: 1.5rem;
    margin-bottom: 1rem;
}

.card h6 {
    color: var(--text-color);
    margin-top: 0;
    margin-bottom: 1.5rem;
    font-size: 1.1rem;
    font-weight: 600;
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .profile-avatar {
        width: 80px;
        height: 80px;
    }

    .avatar-edit-btn {
        width: 32px;
        height: 32px;
    }
}
</style>
