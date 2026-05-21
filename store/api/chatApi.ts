import { baseApi } from "./baseApi";

export const chatApi = baseApi
  .enhanceEndpoints({ addTagTypes: ["Chats", "ChatMessages"] })
  .injectEndpoints({
    endpoints: (builder) => ({
      getChats: builder.query<
        { data: any[]; errors: any[]; statusCode: number },
        void
      >({
        query: () => ({
          url: "/Chat/get-chats",
          method: "GET",
        }),
        providesTags: ["Chats"],
      }),
      getChatById: builder.query<any, { chatId: number }>({
        query: ({ chatId }) => ({
          url: `/Chat/get-chat-by-id`,
          method: "GET",
          params: { chatId },
        }),
        providesTags: (result, error, arg) => [
          { type: "ChatMessages", id: arg.chatId },
        ],
      }),
      createChat: builder.mutation<
        { data: number; errors: any[]; statusCode: number },
        { receiverUserId: string }
      >({
        query: ({ receiverUserId }) => ({
          url: `/Chat/create-chat`,
          method: "POST",
          params: { receiverUserId },
        }),
        invalidatesTags: ["Chats"],
      }),
      sendMessage: builder.mutation<
        any,
        { chatId: number; messageText?: string; file?: File }
      >({
        query: ({ chatId, messageText, file }) => {
          const formData = new FormData();
          formData.append("ChatId", chatId.toString());
          if (messageText) formData.append("MessageText", messageText);
          if (file) formData.append("File", file); // Handles standard image/video uploads AND voice recording blobs

          return {
            url: "/Chat/send-message",
            method: "PUT",
            body: formData, // Crucial: Must use multipart/form-data content type
          };
        },
        invalidatesTags: (result, error, arg) => [
          "Chats",
          { type: "ChatMessages", id: arg.chatId },
        ],
      }),
      deleteMessage: builder.mutation<
        any,
        { messageId: number; chatId: number }
      >({
        query: ({ messageId }) => ({
          url: `/Chat/delete-message`,
          method: "DELETE",
          params: { massageId: messageId }, // Matches 'massageId' query parameter typo in swagger
        }),
        invalidatesTags: (result, error, arg) => [
          { type: "ChatMessages", id: arg.chatId },
        ],
      }),
      deleteChat: builder.mutation<any, { chatId: number }>({
        query: ({ chatId }) => ({
          url: `/Chat/delete-chat`,
          method: "DELETE",
          params: { chatId },
        }),
        invalidatesTags: ["Chats"],
      }),
      getUsers: builder.query<
        { data: any[]; errors: any[]; statusCode: number },
        {
          UserName?: string;
          Email?: string;
          PageNumber?: number;
          PageSize?: number;
        } | void
      >({
        query: (params) => ({
          url: "/User/get-users",
          method: "GET",
          params: params || undefined,
        }),
      }),
      getMyProfile: builder.query<
        { data: any; errors: any[]; statusCode: number },
        void
      >({
        query: () => ({
          url: "/UserProfile/get-my-profile",
          method: "GET",
        }),
      }),
    }),
  });

export const {
  useGetChatsQuery,
  useGetChatByIdQuery,
  useCreateChatMutation,
  useSendMessageMutation,
  useDeleteMessageMutation,
  useDeleteChatMutation,
  useGetUsersQuery,
  useGetMyProfileQuery,
} = chatApi;
