import { CONTACT, RECRUIT_EMAIL, STORE_LIST, RETURN_POLICY, SHIPPING } from './siteConfig.js';

/**
 * Footer modal content, keyed by slug. All copy is Vietnamese, concise, and
 * uses placeholder values from siteConfig where real facts are not confirmed.
 *
 * TODO chủ cửa hàng cần xác nhận lại:
 *  - Hotline thật (hiện 1900 0000), email thật, địa chỉ thật (CONTACT)
 *  - Email nhận CV (RECRUIT_EMAIL)
 *  - Số ngày đổi trả và điều kiện cụ thể (RETURN_POLICY)
 *  - Phí vận chuyển (SHIPPING.fee)
 *  - Danh sách cửa hàng thật + địa chỉ (STORE_LIST)
 */

export const FOOTER_CONTENT = {
  /* ---- Cột "Về DryFood" ---- */
  'cau-chuyen': {
    title: 'Câu chuyện của chúng tôi',
    intro: 'DryFood là cửa hàng thực phẩm khô chọn lọc, hướng tới bữa ăn mỗi ngày tiện lợi và an toàn.',
    sections: [
      {
        h: 'Chúng tôi bắt đầu từ đâu',
        p: 'DryFood được xây dựng như một hệ thống thương mại thực phẩm khô trọn vẹn: từ khâu chọn nguyên liệu, đóng gói sạch đến giao tận nơi cho khách hàng.'
      },
      {
        h: 'Cam kết chọn lọc nguồn nguyên liệu',
        p: 'Mì gói, đồ khô, hạt và trái cây sấy trong cửa hàng đều được kiểm tra nguồn gốc, độ ẩm và chất lượng trước khi đóng gói.'
      },
      {
        h: 'Đóng gói sạch, tiện lợi',
        p: 'Sản phẩm được đóng gói theo khẩu phần rõ ràng, dễ bảo quản và dễ sử dụng cho bữa ăn hằng ngày.'
      }
    ]
  },

  'he-thong-cua-hang': {
    title: 'Hệ thống cửa hàng',
    intro: 'Ghế thăm cửa hàng gần nhất để xem sản phẩm trực tiếp và được tư vấn.',
    sections: [
      {
        h: 'Danh sách cửa hàng',
        list: STORE_LIST.map(s => `${s.area}: ${s.name}, ${s.address} (${s.phone})`)
      }
    ]
  },

  'tuyen-dung': {
    title: 'Tuyển dụng',
    intro: 'Cảm ơn bạn đã quan tâm đến cơ hội làm việc tại DryFood.',
    sections: [
      {
        h: 'Vị trí đang mở',
        p: 'Hiện tại DryFood chưa có vị trí tuyển dụng mới. Bạn có thể gửi CV để chúng tôi cân nhắc cho đợt tuyển dụng tới.'
      },
      {
        h: 'Cách gửi hồ sơ',
        list: RECRUIT_EMAIL === 'Đang cập nhật'
          ? ['Email nhận CV: Đang cập nhật (sẽ thông báo khi có vị trí mở)']
          : [`Email nhận CV: ${RECRUIT_EMAIL}`]
      }
    ]
  },

  'lien-he': {
    title: 'Liên hệ',
    intro: 'Chúng tôi sẵn sàng hỗ trợ bạn trong giờ làm việc.',
    sections: [
      {
        h: 'Tổng đài',
        list: [
          `Hotline: ${CONTACT.hotline}`,
          `Giờ làm việc: ${CONTACT.workHours}`
        ]
      },
      {
        h: 'Email',
        list: CONTACT.email === 'Đang cập nhật'
          ? ['Email: Đang cập nhật']
          : [`Email: ${CONTACT.email}`]
      },
      {
        h: 'Địa chỉ',
        list: CONTACT.address === 'Đang cập nhật'
          ? ['Địa chỉ: Đang cập nhật']
          : [`Địa chỉ: ${CONTACT.address}`]
      }
    ]
  },

  /* ---- Cột "Hỗ trợ khách hàng" ---- */
  'trung-tam-tro-giup': {
    title: 'Trung tâm trợ giúp',
    intro: 'Chọn chủ đề bạn cần, chúng tôi sẽ hướng dẫn chi tiết từng bước.',
    sections: [
      {
        h: 'Các chủ đề thường gặp',
        links: [
          { label: 'Hướng dẫn mua hàng', slug: 'huong-dan-mua-hang' },
          { label: 'Theo dõi đơn hàng', slug: 'theo-doi-don-hang' },
          { label: 'Chính sách vận chuyển', slug: 'chinh-sach-van-chuyen' },
          { label: 'Chính sách đổi trả', slug: 'chinh-sach-doi-tra' }
        ]
      }
    ]
  },

  'theo-doi-don-hang': {
    title: 'Theo dõi đơn hàng',
    intro: 'Xem trạng thái và lịch sử đơn hàng của bạn.',
    sections: [
      {
        h: 'Đơn hàng của khách hàng đã đăng nhập',
        p: 'Để xem trạng thái đơn hàng, vui lòng đăng nhập tài khoản khách hàng và vào mục "Đơn của tôi". Hệ thống sẽ hiển thị trạng thái mới nhất cùng lịch sử cập nhật.'
      },
      {
        h: 'Đi tới đơn hàng của tôi',
        to: '/store/orders',
        toLabel: 'Mở trang Đơn của tôi'
      },
      {
        h: 'Cần trợ giúp?',
        p: 'Nếu bạn gặp vấn đề với đơn hàng, hãy gọi hotline hoặc gửi email cho chúng tôi để được hỗ trợ nhanh nhất.'
      }
    ]
  },

  'huong-dan-mua-hang': {
    title: 'Hướng dẫn mua hàng',
    intro: 'Bốn bước ngắn để đặt hàng tại DryFood.',
    sections: [
      {
        h: 'Các bước đặt hàng',
        steps: [
          'Chọn sản phẩm bạn cần trong cửa hàng.',
          'Bấm "Thêm vào giỏ" và kiểm tra giỏ hàng.',
          'Đăng nhập (hoặc tạo tài khoản) và điền thông tin giao hàng.',
          'Chọn phương thức thanh toán, xác nhận đơn hàng.'
        ]
      },
      {
        h: 'Sau khi đặt hàng',
        p: 'Chúng tôi sẽ xác nhận đơn trong ngày và giao hàng theo lịch của đơn vị vận chuyển. Bạn có thể theo dõi trạng thái trong mục "Đơn của tôi".'
      }
    ]
  },

  'cau-hoi-thuong-gap': {
    title: 'Câu hỏi thường gặp',
    intro: 'Một số câu hỏi phổ biến khi mua hàng tại DryFood.',
    sections: [
      {
        h: 'Câu hỏi phổ biến',
        faqs: [
          { q: 'Đồ khô bảo quản được bao lâu?', a: 'Thời hạn sử dụng ghi trên từng bao bì sản phẩm. Bạn nên bảo quản nơi khô ráo, thoáng mát, tránh ánh nắng trực tiếp.' },
          { q: 'Làm sao để đặt hàng?', a: 'Chọn sản phẩm, thêm vào giỏ, đăng nhập và điền thông tin giao hàng rồi xác nhận đơn. Xem chi tiết trong "Hướng dẫn mua hàng".' },
          { q: 'Có những hình thức thanh toán nào?', a: 'Hiện có thanh toán khi nhận hàng (COD) và chuyển khoản trước khi giao.' },
          { q: 'Giao hàng mất bao lâu?', a: 'Đơn được xác nhận trong ngày; thời gian giao tùy theo đơn vị vận chuyển và khu vực.' },
          { q: 'Có miễn phí giao hàng không?', a: 'Có, đơn từ 200.000 ₫ được miễn phí giao hàng.' },
          { q: 'Làm sao để đổi trả sản phẩm?', a: 'Vui lòng liên hệ hotline trong thời gian áp dụng chính sách đổi trả để được hướng dẫn cụ thể.' },
          { q: 'Sản phẩm có nguồn gốc rõ ràng không?', a: 'Chúng tôi chọn nguồn nguyên liệu có kiểm soát và đóng gói kiểm tra trước khi bán.' },
          { q: 'Quên mật khẩu thì làm sao?', a: 'Bạn có thể liên hệ hotline để được hỗ trợ đặt lại mật khẩu tài khoản.' }
        ]
      }
    ]
  },

  /* ---- Cột "Chính sách" ---- */
  'chinh-sach-bao-mat': {
    title: 'Chính sách bảo mật',
    intro: 'DryFood cam kết bảo vệ thông tin cá nhân của khách hàng.',
    sections: [
      {
        h: 'Chúng tôi thu thập thông tin gì',
        p: 'Khi bạn đăng ký tài khoản hoặc đặt hàng, chúng tôi thu thập tên, email, số điện thoại, địa chỉ giao hàng và lịch sử đơn hàng.'
      },
      {
        h: 'Thông tin được dùng để làm gì',
        p: 'Thông tin được dùng để xử lý đơn hàng, giao hàng, chăm sóc khách hàng và gửi thông báo liên quan đến đơn hàng của bạn.'
      },
      {
        h: 'Lưu trữ và bảo mật',
        p: 'Dữ liệu được lưu trữ an toàn và chỉ truy cập bởi bộ phận vận hành khi cần xử lý đơn hàng. Chúng tôi không bán thông tin cho bên thứ ba.'
      },
      {
        h: 'Quyền của khách hàng',
        p: 'Bạn có thể yêu cầu cập nhật hoặc xóa thông tin cá nhân bất kỳ lúc nào bằng cách liên hệ hotline hoặc email.'
      }
    ]
  },

  'chinh-sach-doi-tra': {
    title: 'Chính sách đổi trả',
    intro: 'Quy định đổi trả áp dụng cho sản phẩm lỗi hoặc không đúng yêu cầu.',
    sections: [
      {
        h: 'Điều kiện đổi trả',
        list: RETURN_POLICY.condition === 'Đang cập nhật'
          ? ['Điều kiện cụ thể: Đang cập nhật (liên hệ hotline để được hỗ trợ).']
          : [RETURN_POLICY.condition]
      },
      {
        h: 'Thời gian áp dụng',
        list: RETURN_POLICY.days === 'Đang cập nhật'
          ? ['Thời gian đổi trả: Đang cập nhật.']
          : [`Thời gian đổi trả: ${RETURN_POLICY.days} ngày kể từ khi nhận hàng.`]
      },
      {
        h: 'Quy trình',
        steps: [
          'Liên hệ hotline hoặc email để thông báo yêu cầu đổi trả.',
          'Cửa hàng xác nhận điều kiện và hướng dẫn gửi sản phẩm.',
          'Sau khi kiểm tra, cửa hàng đổi sản phẩm hoặc hoàn tiền theo thỏa thuận.'
        ]
      }
    ]
  },

  'chinh-sach-van-chuyen': {
    title: 'Chính sách vận chuyển',
    intro: 'Chúng tôi giao hàng đến nhiều khu vực trên toàn quốc.',
    sections: [
      {
        h: 'Phạm vi giao hàng',
        p: `Phạm vi: ${SHIPPING.scope}.`
      },
      {
        h: 'Thời gian dự kiến',
        p: `Thời gian: ${SHIPPING.eta}.`
      },
      {
        h: 'Phí vận chuyển',
        list: SHIPPING.fee === 'Đang cập nhật'
          ? ['Phí vận chuyển: Đang cập nhật.', `Đơn từ ${200000} ₫ được miễn phí giao hàng.`]
          : [`Phí vận chuyển: ${SHIPPING.fee}`, `Đơn từ ${200000} ₫ được miễn phí giao hàng.`]
      }
    ]
  },

  'dieu-khoan-su-dung': {
    title: 'Điều khoản sử dụng',
    intro: 'Điều khoản áp dụng khi bạn truy cập và sử dụng website DryFood.',
    sections: [
      {
        h: 'Quyền và trách nhiệm của khách hàng',
        p: 'Bạn chịu trách nhiệm cung cấp thông tin chính xác khi đặt hàng và sử dụng website đúng mục đích mua sắm.'
      },
      {
        h: 'Trách nhiệm của DryFood',
        p: 'DryFood nỗ lực cung cấp thông tin sản phẩm chính xác, xử lý đơn hàng đúng cam kết và hỗ trợ khách hàng trong phạm vi cho phép.'
      },
      {
        h: 'Giới hạn trách nhiệm',
        p: 'DryFood không chịu trách nhiệm về thiệt hại phát sinh từ việc sử dụng thông tin sai mục đích hoặc các yếu tố khách quan ngoài tầm kiểm soát.'
      },
      {
        h: 'Thay đổi điều khoản',
        p: 'Chúng tôi có thể cập nhật điều khoản này theo thời gian và sẽ đăng phiên bản mới nhất tại trang này.'
      }
    ]
  }
};

/** Ordered footer columns: title + list of { slug, label }. */
export const FOOTER_COLS = [
  {
    title: 'Về DryFood',
    links: [
      { slug: 'cau-chuyen', label: 'Câu chuyện của chúng tôi' },
      { slug: 'he-thong-cua-hang', label: 'Hệ thống cửa hàng' },
      { slug: 'tuyen-dung', label: 'Tuyển dụng' },
      { slug: 'lien-he', label: 'Liên hệ' }
    ]
  },
  {
    title: 'Hỗ trợ khách hàng',
    links: [
      { slug: 'trung-tam-tro-giup', label: 'Trung tâm trợ giúp' },
      { slug: 'theo-doi-don-hang', label: 'Theo dõi đơn hàng' },
      { slug: 'huong-dan-mua-hang', label: 'Hướng dẫn mua hàng' },
      { slug: 'cau-hoi-thuong-gap', label: 'Câu hỏi thường gặp' }
    ]
  },
  {
    title: 'Chính sách',
    links: [
      { slug: 'chinh-sach-bao-mat', label: 'Chính sách bảo mật' },
      { slug: 'chinh-sach-doi-tra', label: 'Chính sách đổi trả' },
      { slug: 'chinh-sach-van-chuyen', label: 'Chính sách vận chuyển' },
      { slug: 'dieu-khoan-su-dung', label: 'Điều khoản sử dụng' }
    ]
  }
];
