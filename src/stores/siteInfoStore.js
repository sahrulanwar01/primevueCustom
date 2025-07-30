// C:\Users\sst_i\Downloads\sourcode\template\sakai-vue-master\src\stores\siteInfoStore.js
import SiteInfoService from '@/service/SiteInfoService';
import { defineStore } from 'pinia';

// Helper untuk bikin URL lengkap dari path relatif
function buildFullUrl(path) {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
    return path.startsWith('http') ? path : baseUrl + path;
}

export const useSiteInfoStore = defineStore('siteInfo', {
    state: () => ({
        siteInfo: null,
        loading: false,
        error: null
    }),

    getters: {
        getSiteName: (state) => state.siteInfo?.site_name,
        getFavicon: (state) => state.siteInfo?.favicon,
        getSiteLogo: (state) => state.siteInfo?.site_logo || null,
        getLoginImage: (state) => state.siteInfo?.img_login || null,
        getSiteDescription: (state) => state.siteInfo?.site_description || '',
        getContactEmail: (state) => state.siteInfo?.contact_email || '',
        getPhone: (state) => state.siteInfo?.phone || '',
        getAddress: (state) => state.siteInfo?.address || ''
    },

    actions: {
        async fetchSiteInfo() {
            this.loading = true;
            this.error = null;

            try {
                const response = await SiteInfoService.getSiteInfo();
                if (response && response.statusCode === 200) {
                    this.siteInfo = response.data;
                    this.updatePageTitle();
                    this.updateFavicon();
                    this.updateMetaDescription();
                } else {
                    this.error = 'Failed to fetch site info';
                }

                // console.log('Favicon (logo):', this.getSiteLogo);
            } catch (error) {
                this.error = error.message || 'Error fetching site info';
                console.error('Error in fetchSiteInfo:', error);
            } finally {
                this.loading = false;
            }
        },

        updatePageTitle() {
            if (this.siteInfo?.site_name) {
                document.title = this.siteInfo.site_name;
            }
        },

        updateFavicon() {
            if (this.siteInfo?.favicon) {
                const fullFaviconUrl = buildFullUrl(this.siteInfo.favicon);
                // console.log('Favicon set to:', fullFaviconUrl);

                let faviconLink = document.querySelector('link[rel="icon"]');
                if (!faviconLink) {
                    faviconLink = document.createElement('link');
                    faviconLink.rel = 'icon';
                    document.head.appendChild(faviconLink);
                }

                faviconLink.type = 'image/png';
                faviconLink.href = fullFaviconUrl;
            }
        },

        updateMetaDescription() {
            if (this.siteInfo?.site_description) {
                let metaDescription = document.querySelector('meta[name="description"]');
                if (!metaDescription) {
                    metaDescription = document.createElement('meta');
                    metaDescription.name = 'description';
                    document.head.appendChild(metaDescription);
                }

                metaDescription.content = this.siteInfo.site_description;
            }
        }
    }
});
